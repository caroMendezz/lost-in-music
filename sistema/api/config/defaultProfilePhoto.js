// Foto de perfil predeterminada para los usuarios que no eligen una imagen al
// registrarse. El archivo vive en api/assets y se sirve de forma estatica en /assets.
const DEFAULT_PROFILE_PHOTO = "/assets/default-profile.png";
const INVALID_SOURCE = /^(file:|[a-z]:[\\/])/i;

// Devuelve la foto recibida o la predeterminada cuando no hay una imagen valida.
function resolveProfilePhoto(profilePhoto) {
  if (typeof profilePhoto !== "string") return DEFAULT_PROFILE_PHOTO;

  const value = profilePhoto.trim();

  if (
    !value ||
    value === "null" ||
    value === "undefined" ||
    value === "vacio" ||
    INVALID_SOURCE.test(value)
  ) {
    return DEFAULT_PROFILE_PHOTO;
  }

  return value;
}

module.exports = { DEFAULT_PROFILE_PHOTO, resolveProfilePhoto };