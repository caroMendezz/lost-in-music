const { Op } = require("sequelize");
const mongoose = require("mongoose");

const Report = require("../models/Report");
const Post = require("../models/Post");
const { User } = require("../models/User");
const { getBanExpiration } = require("../services/banService");

// =====================================================
// CONFIGURACIÓN
// =====================================================

const MIN_REASON_LENGTH = 8;
const MAX_REASON_LENGTH = 500;
const MAX_REPORTS_PER_LIST = 300;

const REPORT_STATUSES = ["pending", "resolved", "dismissed"];
const TARGET_TYPES = ["user", "post"];

// Datos mínimos del usuario que se devuelven en cada reporte.
// No se incluye profilePhoto: las fotos se guardan como base64 en un
// LONGTEXT y traerlas en cada listado haría muy pesada la respuesta.
const USER_ATTRIBUTES = [
  "userId",
  "username",
  "idRole",
  "eliminated",
  "bannedUntil",
  "banReason",
  "penaltyDate",
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

const currentUserId = (req) => Number(req.user?.userId ?? req.user?.id);

// Los administradores no pueden ser reportados (ni desde un perfil
// ni a través de una de sus publicaciones).
const isAdminRole = (user) => Number(user?.idRole) === 2;

// Dirección de la foto: las que empiezan con "/" las sirve el backend.
const safeImage = (value) => {
  const image = String(value || "");
  if (!image.startsWith("/uploads/")) return null;
  return image.slice(0, 1000);
};

const serializeTarget = (user) => {
  if (!user) {
    return {
      userId: null,
      username: "Usuario eliminado",
      profilePhoto: null,
      banned: false,
      bannedUntil: null,
      banReason: null,
    };
  }

  const until = getBanExpiration(user);

  return {
    userId: user.userId,
    username: user.username,
    profilePhoto: user.profilePhoto || null,
    eliminated: Boolean(user.eliminated),
    banned: Boolean(until),
    bannedUntil: until ? until.toISOString() : null,
    banReason: until ? user.banReason || null : null,
  };
};

const serializeReporter = (user) => ({
  userId: user?.userId ?? null,
  username: user?.username ?? "Usuario eliminado",
  profilePhoto: user?.profilePhoto || null,
});

const serializeReport = (report, usersById = new Map()) => {
  const reporter = usersById.get(Number(report.reporterId)) || null;
  const target = report.targetUserId
    ? usersById.get(Number(report.targetUserId)) || null
    : null;

  return {
    reportId: report.reportId,
    targetType: report.targetType,
    targetPostId: report.targetPostId || null,
    postText: report.postText || "",
    postImage: report.postImage || null,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reviewedBy: report.reviewedBy,
    resolutionNote: report.resolutionNote || null,
    reporter: serializeReporter(reporter),
    target: serializeTarget(target),
  };
};

const buildWhere = ({ status, type, q }) => {
  const where = {};

  if (status && status !== "all" && REPORT_STATUSES.includes(status)) {
    where.status = status;
  }

  if (type && type !== "all" && TARGET_TYPES.includes(type)) {
    where.targetType = type;
  }

  const search = String(q || "").trim();

  if (search) {
    where[Op.or] = [
      { targetUsername: { [Op.like]: `%${search}%` } },
      { reason: { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
};

const countByStatus = async () => {
  const [pending, resolved, dismissed] = await Promise.all(
    REPORT_STATUSES.map((status) => Report.count({ where: { status } }))
  );

  return {
    pending,
    resolved,
    dismissed,
    total: pending + resolved + dismissed,
  };
};

// Busca los usuarios que aparecen en una lista de reportes (remitente y
// destinatario) en una sola consulta.
const loadUsers = async (reports) => {
  const ids = new Set();

  for (const report of reports) {
    if (report.reporterId) ids.add(Number(report.reporterId));
    if (report.targetUserId) ids.add(Number(report.targetUserId));
  }

  if (ids.size === 0) return new Map();

  const users = await User.findAll({
    where: { userId: [...ids] },
    attributes: USER_ATTRIBUTES,
    raw: true,
  });

  return new Map(users.map((user) => [Number(user.userId), user]));
};

// =====================================================
// CREAR UN REPORTE (usuario común)
// =====================================================

// POST /reports
const createReport = async (req, res) => {
  try {
    const reporterId = currentUserId(req);
    const targetType = String(req.body?.targetType || "").toLowerCase();
    const reason = String(req.body?.reason || "").trim();

    if (!TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({
        message: "El tipo de reporte no es válido",
      });
    }

    if (reason.length < MIN_REASON_LENGTH) {
      return res.status(400).json({
        message: `La razón debe tener al menos ${MIN_REASON_LENGTH} caracteres`,
      });
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        message: `La razón no puede superar los ${MAX_REASON_LENGTH} caracteres`,
      });
    }

    let targetUser = null;
    let targetPost = null;

    if (targetType === "user") {
      const targetId = Number(req.body?.targetUserId);

      if (!Number.isInteger(targetId) || targetId <= 0) {
        return res.status(400).json({
          message: "El usuario a reportar no es válido",
        });
      }

      targetUser = await User.findByPk(targetId);

      if (!targetUser || targetUser.eliminated) {
        return res.status(404).json({
          message: "El usuario que querés reportar ya no existe",
        });
      }

      if (Number(targetUser.userId) === reporterId) {
        return res.status(400).json({
          message: "No podés reportarte a vos mismo",
        });
      }
    } else {
      const postId = String(req.body?.targetPostId || "").trim();

      if (!mongoose.isValidObjectId(postId)) {
        return res.status(400).json({
          message: "La publicación a reportar no es válida",
        });
      }

      targetPost = await Post.findById(postId);

      if (!targetPost || targetPost.eliminated) {
        return res.status(404).json({
          message: "La publicación que querés reportar ya no existe",
        });
      }

      if (Number(targetPost.userId) === reporterId) {
        return res.status(400).json({
          message: "No podés reportar tu propia publicación",
        });
      }

      targetUser = await User.findByPk(targetPost.userId);

      if (!targetUser) {
        return res.status(404).json({
          message: "El autor de la publicación ya no existe",
        });
      }
    }

    if (isAdminRole(targetUser)) {
      return res.status(403).json({
        message: "No se puede reportar a un administrador",
      });
    }

    // Evita que el mismo usuario llene la bandeja con el mismo reporte.
    const duplicateWhere = {
      reporterId,
      targetType,
      status: "pending",
    };

    if (targetType === "post") {
      duplicateWhere.targetPostId = String(targetPost._id);
    } else {
      duplicateWhere.targetUserId = Number(targetUser.userId);
    }

    const duplicate = await Report.findOne({ where: duplicateWhere });

    if (duplicate) {
      return res.status(409).json({
        message:
          "Ya enviaste un reporte sobre esto y todavía está pendiente de revisión",
      });
    }

    const report = await Report.create({
      reporterId,
      targetType,
      targetUserId: Number(targetUser.userId),
      targetPostId: targetPost ? String(targetPost._id) : null,
      targetUsername: targetUser.username,
      postText: targetPost
        ? String(targetPost.postText || "").slice(0, 2000)
        : null,
      postImage: targetPost
        ? safeImage(Array.isArray(targetPost.image) ? targetPost.image[0] : null)
        : null,
      reason,
      status: "pending",
    });

    const usersById = await loadUsers([report]);

    return res.status(201).json({
      message: "Reporte enviado. Un administrador lo va a revisar.",
      report: serializeReport(report, usersById),
    });
  } catch (error) {
    console.error("Error al crear el reporte:", error);

    return res.status(500).json({
      message: "No se pudo enviar el reporte",
    });
  }
};

// =====================================================
// LISTAR REPORTES (administración)
// =====================================================

// GET /admin/reports?status=pending&type=post&q=texto
const listReports = async (req, res) => {
  try {
    const where = buildWhere({
      status: req.query.status,
      type: req.query.type,
      q: req.query.q,
    });

    const reports = await Report.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: MAX_REPORTS_PER_LIST,
    });

    const usersById = await loadUsers(reports);
    const stats = await countByStatus();

    return res.status(200).json({
      reports: reports.map((report) => serializeReport(report, usersById)),
      stats,
    });
  } catch (error) {
    console.error("Error al listar los reportes:", error);

    return res.status(500).json({
      message: "No se pudieron cargar los reportes",
    });
  }
};

// GET /admin/reports/count
const getReportsCount = async (req, res) => {
  try {
    const stats = await countByStatus();

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error al contar los reportes:", error);

    return res.status(500).json({
      message: "No se pudieron contar los reportes",
    });
  }
};

// =====================================================
// CAMBIAR EL ESTADO DE UN REPORTE (administración)
// =====================================================

// PATCH /admin/reports/:id
// body: { status: "pending" | "resolved" | "dismissed", note?: string }
const updateReportStatus = async (req, res) => {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        message: "El reporte no es válido",
      });
    }

    const status = String(req.body?.status || "").toLowerCase();

    if (!REPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "El estado del reporte no es válido",
      });
    }

    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        message: "El reporte no existe",
      });
    }

    const note = String(req.body?.note || "").trim().slice(0, 255);

    report.status = status;
    report.resolutionNote = note || null;

    if (status === "pending") {
      report.reviewedBy = null;
      report.reviewedAt = null;
    } else {
      report.reviewedBy = currentUserId(req);
      report.reviewedAt = new Date();
    }

    await report.save();

    const usersById = await loadUsers([report]);

    return res.status(200).json({
      message:
        status === "pending"
          ? "El reporte volvió a quedar pendiente"
          : status === "resolved"
            ? "Reporte marcado como resuelto"
            : "Reporte descartado",
      report: serializeReport(report, usersById),
    });
  } catch (error) {
    console.error("Error al actualizar el reporte:", error);

    return res.status(500).json({
      message: "No se pudo actualizar el reporte",
    });
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  createReport,
  listReports,
  getReportsCount,
  updateReportStatus,
};
