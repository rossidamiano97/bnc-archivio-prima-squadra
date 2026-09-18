import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import {
  BarChart3,
  CalendarDays,
  LogIn,
  LogOut,
  Plus,
  Shield,
  Trophy,
} from "lucide-react";

import {
  auth,
  configured,
  db,
} from "./firebase";
import {
  isAdmin,
  save,
} from "./data";
import type {
  Match,
  Player,
  PlayerStat,
  Season,
} from "./types";

interface PublicData {
  players: Player[];
  seasons: Season[];
  matches: Match[];
  stats: PlayerStat[];
  loading: boolean;
}

function usePublicData(): PublicData {
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    async function loadCollection(
      collectionName: string,
      sortField: string,
      direction: "asc" | "desc" = "asc",
    ) {
      const databaseQuery = query(
        collection(db, collectionName),
        orderBy(sortField, direction),
      );

      const snapshot = await getDocs(databaseQuery);

      return snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }));
    }

    async function loadData() {
      try {
        const [
          playersData,
          seasonsData,
          matchesData,
          statsData,
        ] = await Promise.all([
          loadCollection(
            "players",
            "displayName",
          ),
          loadCollection(
            "seasons",
            "label",
            "desc",
          ),
          loadCollection(
            "matches",
            "date",
            "desc",
          ),
          loadCollection(
            "playerCareerStats",
            "goals",
            "desc",
          ),
        ]);

        setPlayers(
          (playersData as unknown as Player[]).filter(
            (player) =>
              player.status === "published",
          ),
        );

        setSeasons(
          (seasonsData as unknown as Season[]).filter(
            (season) =>
              season.status === "published",
          ),
        );

        setMatches(
          (matchesData as unknown as Match[]).filter(
            (match) =>
              match.status === "published",
          ),
        );

        setStats(
          statsData as unknown as PlayerStat[],
        );
      } catch (error) {
        console.error(
          "Errore durante il caricamento dei dati:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  return {
    players,
    seasons,
    matches,
    stats,
    loading,
  };
}

interface ShellProps {
  children: ReactNode;
  user: User | null;
  admin: boolean;
}

function Shell({
  children,
  user,
  admin,
}: ShellProps) {
  return (
    <>
      <header>
        <Link
          className="brand"
          to="/"
          aria-label="Vai alla home dell'archivio A.C. BNC"
        >
          /logo-bnc.png

          <span>
            <b>A.C. BNC</b>
            <small>
              Archivio Prima Squadra
            </small>
          </span>
        </Link>

        <nav>
          <Link to="/stagioni">
            Stagioni
          </Link>

          <Link to="/giocatori">
            Giocatori
          </Link>

          <Link to="/partite">
            Partite
          </Link>

          <Link to="/record">
            Record
          </Link>

          {admin && (
            <Link to="/admin">
              Gestione
            </Link>
          )}

          {user ? (
            <button
              className="linkbtn"
              type="button"
              onClick={() => {
                void signOut(auth);
              }}
            >
              <LogOut size={17} />
              Esci
            </button>
          ) : (
            <Link to="/login">
              <LogIn size={17} />
              Accedi
            </Link>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        A.C. BNC · Archivio storico della Prima Squadra
      </footer>
    </>
  );
}

function SectionTitle({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <h2 className="sectiontitle">
      {children}
    </h2>
  );
}

interface MetricProps {
  icon: ReactNode;
  number: number;
  title: string;
}

function Metric({
  icon,
  number,
  title,
}: MetricProps) {
  return (
    <article className="metric">
      <i>{icon}</i>
      <strong>{number}</strong>
      <span>{title}</span>
    </article>
  );
}

function Empty() {
  return (
    <div className="empty">
      I dati verranno visualizzati dopo
      l&apos;importazione dello storico.
    </div>
  );
}

function MatchList({
  items,
}: {
  items: Match[];
}) {
  if (!items.length) {
    return <Empty />;
  }

  return (
    <div className="list">
      {items.map((match) => (
        <article
    
