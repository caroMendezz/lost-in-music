import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useFriends } from '../components/FriendsContext';
import {
  resolveMedia,
  searchPeople,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
} from '../services/friendsApi';
import '../styles/Friends.css';

const DEFAULT_LOCATION = 'Agregar ubicacion'; // valor que el backend pone al registrarse

function Avatar({ person }) {
  const photo = resolveMedia(person.profilePhoto);
  return (
    <div className="friends-avatar">
      {photo ? <img src={photo} alt={person.username} /> : <span>👤</span>}
      {person.online && <span className="friends-dot" title="En línea" />}
    </div>
  );
}

// Botones según la relación con la persona
function RelationActions({ relation, busy, onSend, onAccept, onRemove }) {
  switch (relation) {
    case 'friend':
      return (
        <>
          <span className="friends-tag">Amigos ✓</span>
          <button type="button" className="friends-btn friends-btn--danger" disabled={busy} onClick={onRemove}>
            Eliminar
          </button>
        </>
      );
    case 'pending_sent':
      return (
        <>
          <span className="friends-tag">Solicitud enviada</span>
          <button type="button" className="friends-btn" disabled={busy} onClick={onRemove}>
            Cancelar
          </button>
        </>
      );
    case 'pending_received':
      return (
        <>
          <button type="button" className="friends-btn friends-btn--primary" disabled={busy} onClick={onAccept}>
            Aceptar
          </button>
          <button type="button" className="friends-btn" disabled={busy} onClick={onRemove}>
            Rechazar
          </button>
        </>
      );
    default:
      return (
        <button type="button" className="friends-btn friends-btn--primary" disabled={busy} onClick={onSend}>
          Añadir amigo
        </button>
      );
  }
}

function PersonRow({ person, relation, busy, handlers }) {
  let subtitle = null;
  if (relation === 'friend') subtitle = person.online ? 'En línea' : 'Desconectado';
  else if (person.ubication && person.ubication !== DEFAULT_LOCATION) subtitle = person.ubication;

  return (
    <li className="friends-row">
      <Avatar person={person} />

      <div className="friends-info">
        <div className="friends-name">{person.username}</div>
        {subtitle && (
          <div className={`friends-sub ${relation === 'friend' && person.online ? 'friends-sub--online' : ''}`}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="friends-actions">
        <RelationActions
          relation={relation}
          busy={busy}
          onSend={() => handlers.send(person)}
          onAccept={() => handlers.accept(person)}
          onRemove={() => handlers.remove(person, relation)}
        />
      </div>
    </li>
  );
}

function FriendsPage() {
  const { friends, requests, loading, refresh } = useFriends();

  const [tab, setTab] = useState('friends'); // friends | requests | search
  const [filter, setFilter] = useState('');  // filtra "Mis amigos"
  const [query, setQuery] = useState('');    // busca personas nuevas
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());

  // Al entrar a la página se actualiza la lista
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Búsqueda de personas (espera 350 ms después de la última tecla)
  useEffect(() => {
    if (tab !== 'search') return undefined;

    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchPeople(text);
        if (!cancelled) setResults(data);
      } catch (error) {
        console.error('Error al buscar personas:', error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tab]);

  // Ejecuta una acción sobre una persona y actualiza la pantalla
  const run = async (userId, action) => {
    if (busyIds.has(userId)) return;
    setBusyIds((prev) => new Set(prev).add(userId));
    try {
      const { relation } = await action(userId);
      // Si la persona está en los resultados de búsqueda, se actualiza su botón
      setResults((prev) => prev.map((r) => (r.userId === userId ? { ...r, relation } : r)));
      await refresh();
    } catch (error) {
      alert(error.message || 'No se pudo completar la acción');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handlers = {
    send: (person) => run(person.userId, sendFriendRequest),
    accept: (person) => run(person.userId, acceptFriendRequest),
    remove: (person, relation) => {
      if (relation === 'friend' && !window.confirm(`¿Eliminar a ${person.username} de tus amigos?`)) {
        return;
      }
      run(person.userId, removeFriendship);
    },
  };

  // Mis amigos: los conectados primero, y después por nombre
  const visibleFriends = useMemo(() => {
    const text = filter.trim().toLowerCase();
    return friends
      .filter((f) => f.username.toLowerCase().includes(text))
      .sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
  }, [friends, filter]);

  const onlineCount = friends.filter((f) => f.online).length;
  const pendingCount = requests.received.length;

  const renderRows = (people, relation) =>
    people.map((person) => (
      <PersonRow
        key={person.userId}
        person={person}
        relation={relation ?? person.relation}
        busy={busyIds.has(person.userId)}
        handlers={handlers}
      />
    ));

  const renderFriendsTab = () => (
    <>
      <input
        className="friends-input"
        type="text"
        placeholder="Buscar entre tus amigos…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {loading ? (
        <div className="friends-empty">Cargando amigos…</div>
      ) : friends.length === 0 ? (
        <div className="friends-empty">
          Todavía no tenés amigos.
          <div>
            <button type="button" className="friends-btn friends-btn--primary" onClick={() => setTab('search')}>
              Buscar personas
            </button>
          </div>
        </div>
      ) : visibleFriends.length === 0 ? (
        <div className="friends-empty">Ningún amigo coincide con “{filter}”.</div>
      ) : (
        <ul className="friends-list">{renderRows(visibleFriends, 'friend')}</ul>
      )}
    </>
  );

  const renderRequestsTab = () => (
    <>
      <div className="friends-section-title">Recibidas ({requests.received.length})</div>
      {requests.received.length === 0 ? (
        <div className="friends-empty">No tenés solicitudes pendientes.</div>
      ) : (
        <ul className="friends-list">{renderRows(requests.received, 'pending_received')}</ul>
      )}

      <div className="friends-section-title">Enviadas ({requests.sent.length})</div>
      {requests.sent.length === 0 ? (
        <div className="friends-empty">No enviaste solicitudes.</div>
      ) : (
        <ul className="friends-list">{renderRows(requests.sent, 'pending_sent')}</ul>
      )}
    </>
  );

  const renderSearchTab = () => (
    <>
      <input
        className="friends-input"
        type="text"
        placeholder="Buscar personas por nombre de usuario…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {query.trim().length < 2 ? (
        <div className="friends-empty">Escribí al menos 2 letras para buscar.</div>
      ) : searching ? (
        <div className="friends-empty">Buscando…</div>
      ) : results.length === 0 ? (
        <div className="friends-empty">No se encontró a nadie con “{query.trim()}”.</div>
      ) : (
        <ul className="friends-list">{renderRows(results)}</ul>
      )}
    </>
  );

  return (
    <PageLayout>
      <div className="friends-card">
        <h2 className="friends-title">Amigos</h2>

        <div className="friends-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'friends'}
            className={`friends-tab ${tab === 'friends' ? 'friends-tab--active' : ''}`}
            onClick={() => setTab('friends')}
          >
            Mis amigos ({friends.length})
            {onlineCount > 0 && <span className="friends-online-count"> · {onlineCount} en línea</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'requests'}
            className={`friends-tab ${tab === 'requests' ? 'friends-tab--active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Solicitudes
            {pendingCount > 0 && <span className="friends-badge">{pendingCount}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'search'}
            className={`friends-tab ${tab === 'search' ? 'friends-tab--active' : ''}`}
            onClick={() => setTab('search')}
          >
            Buscar personas
          </button>
        </div>

        {tab === 'friends' && renderFriendsTab()}
        {tab === 'requests' && renderRequestsTab()}
        {tab === 'search' && renderSearchTab()}
      </div>
    </PageLayout>
  );
}

export default FriendsPage;