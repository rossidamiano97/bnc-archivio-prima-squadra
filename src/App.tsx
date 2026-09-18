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

      <main>
        {children}
      </main>

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
      <i>
        {icon}
      </i>

      <strong>
        {number}
      </strong>

      <span>
        {title}
      </span>
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
          className="match"
          key={match.id}
        >
          <div>
            <b>
              {match.competition}
            </b>

            <small>
              {match.date} · {match.venue}
            </small>
          </div>

          <strong>
            A.C. BNC

            <em>
              {match.officialGoalsFor}
              {" - "}
              {match.officialGoalsAgainst}
            </em>

            {match.opponent}
          </strong>
        </article>
      ))}
    </div>
  );
}

function Home({
  data,
}: {
  data: PublicData;
}) {
  const totals = useMemo(() => {
    return data.matches.reduce(
      (result, match) => {
        const victory =
          match.officialGoalsFor >
          match.officialGoalsAgainst;

        return {
          matches:
            result.matches + 1,
          wins:
            result.wins +
            (victory ? 1 : 0),
          goalsFor:
            result.goalsFor +
            match.officialGoalsFor,
          goalsAgainst:
            result.goalsAgainst +
            match.officialGoalsAgainst,
        };
      },
      {
        matches: 0,
        wins: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    );
  }, [data.matches]);

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            DAL 2020 A OGGI
          </span>

          <h1>
            La storia della Prima Squadra,
            <br />
            raccontata dai dati.
          </h1>

          <p>
            Risultati, rose, protagonisti, record e
            albo d&apos;oro in un archivio unico e
            costantemente aggiornato.
          </p>

          <Link
            className="cta"
            to="/stagioni"
          >
            Esplora l&apos;archivio
          </Link>
        </div>

        /logo-bnc.png
      </section>

      <section className="metricgrid">
        <Metric
          icon={<CalendarDays />}
          number={totals.matches}
          title="Partite ufficiali"
        />

        <Metric
          icon={<Trophy />}
          number={totals.wins}
          title="Vittorie"
        />

        <Metric
          icon={<BarChart3 />}
          number={totals.goalsFor}
          title="Gol fatti"
        />

        <Metric
          icon={<Shield />}
          number={
            totals.goalsFor -
            totals.goalsAgainst
          }
          title="Differenza reti"
        />
      </section>

      <section>
        <SectionTitle>
          Ultime partite
        </SectionTitle>

        <MatchList
          items={data.matches.slice(0, 6)}
        />
      </section>
    </>
  );
}

function Seasons({
  data,
}: {
  data: PublicData;
}) {
  return (
    <>
      <SectionTitle>
        Stagioni
      </SectionTitle>

      {data.seasons.length ? (
        <div className="cards">
          {data.seasons.map((season) => (
            <article
              className="card"
              key={season.id}
            >
              <span className="eyebrow">
                {season.category}
              </span>

              <h3>
                {season.label}
              </h3>

              <p>
                Allenatore:{" "}
                {season.coach ||
                  "Da completare"}
              </p>

              <p>
                {season.position
                  ? `${season.position}° posto · `
                  : ""}

                {season.points ?? "–"} punti
              </p>
            </article>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </>
  );
}

function Players({
  data,
}: {
  data: PublicData;
}) {
  const sortedStats = [...data.stats].sort(
    (firstPlayer, secondPlayer) =>
      secondPlayer.goals -
      firstPlayer.goals,
  );

  return (
    <>
      <SectionTitle>
        Classifiche individuali
      </SectionTitle>

      <div className="tablewrap">
        {sortedStats.length ? (
          <table>
            <thead>
              <tr>
                <th>
                  #
                </th>

                <th>
                  Giocatore
                </th>

                <th>
                  Pres.
                </th>

                <th>
                  Gol
                </th>

                <th>
                  Assist
                </th>

                <th>
                  Gialli
                </th>

                <th>
                  Rossi
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedStats.map(
                (playerStat, index) => (
                  <tr
                    key={playerStat.playerId}
                  >
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <b>
                        {playerStat.displayName}
                      </b>
                    </td>

                    <td>
                      {playerStat.appearances}
                    </td>

                    <td>
                      {playerStat.goals}
                    </td>

                    <td>
                      {playerStat.assists}
                    </td>

                    <td>
                      {playerStat.yellows}
                    </td>

                    <td>
                      {playerStat.reds}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}

function Matches({
  data,
}: {
  data: PublicData;
}) {
  return (
    <>
      <SectionTitle>
        Archivio partite
      </SectionTitle>

      <MatchList
        items={data.matches}
      />
    </>
  );
}

function Records({
  data,
}: {
  data: PublicData;
}) {
  const bestSeason = [...data.seasons].sort(
    (firstSeason, secondSeason) =>
      (secondSeason.points ?? 0) -
      (firstSeason.points ?? 0),
  )[0];

  const topScorer = [...data.stats].sort(
    (firstPlayer, secondPlayer) =>
      secondPlayer.goals -
      firstPlayer.goals,
  )[0];

  return (
    <>
      <SectionTitle>
        Record e albo d&apos;oro
      </SectionTitle>

      <div className="cards">
        <article className="card gold">
          <h3>
            Maggior numero di punti
          </h3>

          <strong>
            {bestSeason?.points ?? "–"}
          </strong>

          <p>
            {bestSeason?.label ??
              "Dati in importazione"}
          </p>
        </article>

        <article className="card gold">
          <h3>
            Marcatore all time
          </h3>

          <strong>
            {topScorer?.goals ?? "–"}
          </strong>

          <p>
            {topScorer?.displayName ??
              "Dati in importazione"}
          </p>
        </article>

        <article className="card">
          <h3>
            Coppa Verona
          </h3>

          <strong>
            2
          </strong>

          <p>
            2023/24 · 2025/26
          </p>
        </article>
      </div>
    </>
  );
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      navigate("/admin");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Accesso non riuscito. Controlla email e password.",
      );
    }
  }

  return (
    <form
      className="panel login"
      onSubmit={handleSubmit}
    >
      <SectionTitle>
        Accesso amministratori
      </SectionTitle>

      <label>
        Email

        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(
              event.target.value,
            );
          }}
          required
        />
      </label>

      <label>
        Password

        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(
              event.target.value,
            );
          }}
          required
        />
      </label>

      {errorMessage && (
        <p className="error">
          {errorMessage}
        </p>
      )}

      <button
        className="cta"
        type="submit"
      >
        Accedi
      </button>
    </form>
  );
}

function Admin({
  authorized,
}: {
  authorized: boolean;
}) {
  const [
    selectedTab,
    setSelectedTab,
  ] = useState<
    "players" | "seasons" | "matches"
  >("players");

  if (!authorized) {
    return (
      <div className="panel">
        <SectionTitle>
          Accesso non autorizzato
        </SectionTitle>

        <p>
          L&apos;account è autenticato, ma
          non è presente nella raccolta{" "}
          <code>
            admins
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="adminhead">
        <SectionTitle>
          Gestione archivio
        </SectionTitle>

        <div>
          <button
            type="button"
            className={
              selectedTab === "players"
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedTab("players");
            }}
          >
            Giocatori
          </button>

          <button
            type="button"
            className={
              selectedTab === "seasons"
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedTab("seasons");
            }}
          >
            Stagioni
          </button>

          <button
            type="button"
            className={
              selectedTab === "matches"
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedTab("matches");
            }}
          >
            Partite
          </button>
        </div>
      </div>

      {selectedTab === "players" && (
        <PlayerForm />
      )}

      {selectedTab === "seasons" && (
        <SeasonForm />
      )}

      {selectedTab === "matches" && (
        <MatchForm />
      )}
    </>
  );
}

function PlayerForm() {
  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [role, setRole] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await save(
      "players",
      undefined,
      {
        displayName,
        role,
        active: true,
        status: "published",
      },
    );

    setDisplayName("");
    setRole("");

    window.alert(
      "Giocatore salvato",
    );
  }

  return (
    <form
      className="panel"
      onSubmit={handleSubmit}
    >
      <h3>
        <Plus />

        Nuovo giocatore
      </h3>

      <div className="formgrid">
        <label>
          Nome visualizzato

          <input
            value={displayName}
            onChange={(event) => {
              setDisplayName(
                event.target.value,
              );
            }}
            required
          />
        </label>

        <label>
          Ruolo

          <select
            value={role}
            onChange={(event) => {
              setRole(
                event.target.value,
              );
            }}
            required
          >
            <option value="">
              Seleziona
            </option>

            <option value="Portiere">
              Portiere
            </option>

            <option value="Difensore">
              Difensore
            </option>

            <option value="Centrocampista">
              Centrocampista
            </option>

            <option value="Attaccante">
              Attaccante
            </option>
          </select>
        </label>
      </div>

      <button
        className="cta"
        type="submit"
      >
        Salva
      </button>
    </form>
  );
}

function SeasonForm() {
  const [label, setLabel] =
    useState("2026/2027");

  const [category, setCategory] =
    useState("Terza Categoria");

  const [coach, setCoach] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await save(
      "seasons",
      undefined,
      {
        label,
        category,
        coach,
        status: "published",
      },
    );

    window.alert(
      "Stagione salvata",
    );
  }

  return (
    <form
      className="panel"
      onSubmit={handleSubmit}
    >
      <h3>
        <Plus />

        Nuova stagione
      </h3>

      <div className="formgrid">
        <label>
          Stagione

          <input
            value={label}
            onChange={(event) => {
              setLabel(
                event.target.value,
              );
            }}
            required
          />
        </label>

        <label>
          Categoria

          <input
            value={category}
            onChange={(event) => {
              setCategory(
                event.target.value,
              );
            }}
            required
          />
        </label>

        <label>
          Allenatore

          <input
            value={coach}
            onChange={(event) => {
              setCoach(
                event.target.value,
              );
            }}
          />
        </label>
      </div>

      <button
        className="cta"
        type="submit"
      >
        Salva
      </button>
    </form>
  );
}

interface MatchFormState {
  seasonId: string;
  date: string;
  competition: string;
  opponent: string;
  venue: "Casa" | "Trasferta";
  goalsFor: number;
  goalsAgainst: number;
}

function MatchForm() {
  const [
    formData,
    setFormData,
  ] = useState<MatchFormState>({
    seasonId: "2026/2027",
    date: "",
    competition: "Campionato",
    opponent: "",
    venue: "Casa",
    goalsFor: 0,
    goalsAgainst: 0,
  });

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await save(
      "matches",
      undefined,
      {
        ...formData,
        goalsFor:
          Number(formData.goalsFor),
        goalsAgainst:
          Number(
            formData.goalsAgainst,
          ),
        officialGoalsFor:
          Number(formData.goalsFor),
        officialGoalsAgainst:
          Number(
            formData.goalsAgainst,
          ),
        status: "published",
      },
    );

    window.alert(
      "Partita salvata",
    );
  }

  return (
    <form
      className="panel"
      onSubmit={handleSubmit}
    >
      <h3>
        <Plus />

        Nuova partita
      </h3>

      <div className="formgrid">
        <label>
          Stagione

          <input
            value={formData.seasonId}
            onChange={(event) => {
              setFormData({
                ...formData,
                seasonId:
                  event.target.value,
              });
            }}
            required
          />
        </label>

        <label>
          Data

          <input
            type="date"
            value={formData.date}
            onChange={(event) => {
              setFormData({
                ...formData,
                date:
                  event.target.value,
              });
            }}
            required
          />
        </label>

        <label>
          Competizione

          <input
            value={
              formData.competition
            }
            onChange={(event) => {
              setFormData({
                ...formData,
                competition:
                  event.target.value,
              });
            }}
            required
          />
        </label>

        <label>
          Avversario

          <input
            value={formData.opponent}
            onChange={(event) => {
              setFormData({
                ...formData,
                opponent:
                  event.target.value,
              });
            }}
            required
          />
        </label>

        <label>
          Campo

          <select
            value={formData.venue}
            onChange={(event) => {
              setFormData({
                ...formData,
                venue:
                  event.target.value as
                    | "Casa"
                    | "Trasferta",
              });
            }}
          >
            <option value="Casa">
              Casa
            </option>

            <option value="Trasferta">
              Trasferta
            </option>
          </select>
        </label>

        <label>
          Gol BNC

          <input
            type="number"
            min="0"
            value={
              formData.goalsFor
            }
            onChange={(event) => {
              setFormData({
                ...formData,
                goalsFor:
                  Number(
                    event.target.value,
                  ),
              });
            }}
          />
        </label>

        <label>
          Gol avversario

          <input
            type="number"
            min="0"
            value={
              formData.goalsAgainst
            }
            onChange={(event) => {
              setFormData({
                ...formData,
                goalsAgainst:
                  Number(
                    event.target.value,
                  ),
              });
            }}
          />
        </label>
      </div>

      <button
        className="cta"
        type="submit"
      >
        Salva e pubblica
      </button>
    </form>
  );
}

export default function App() {
  const publicData =
    usePublicData();

  const [user, setUser] =
    useState<User | null>(null);

  const [admin, setAdmin] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (authenticatedUser) => {
          setUser(
            authenticatedUser,
          );

          if (!authenticatedUser) {
            setAdmin(false);
            return;
          }

          void isAdmin(
            authenticatedUser.uid,
          )
            .then(
              (accountIsAdmin) => {
                setAdmin(
                  accountIsAdmin,
                );
              },
            )
            .catch((error) => {
              console.error(
                "Errore durante la verifica dell'amministratore:",
                error,
              );

              setAdmin(false);
            });
        },
      );

    return unsubscribe;
  }, []);

  return (
    <Shell
      user={user}
      admin={admin}
    >
      {!configured && (
        <div className="notice">
          Firebase non è ancora configurato.
          Compila le variabili d&apos;ambiente
          seguendo il README.
        </div>
      )}

      {publicData.loading ? (
        <div className="loader">
          Caricamento archivio…
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <Home
                data={publicData}
              />
            }
          />

          <Route
            path="/stagioni"
            element={
              <Seasons
                data={publicData}
              />
            }
          />

          <Route
            path="/giocatori"
            element={
              <Players
                data={publicData}
              />
            }
          />

          <Route
            path="/partite"
            element={
              <Matches
                data={publicData}
              />
            }
          />

          <Route
            path="/record"
            element={
              <Records
                data={publicData}
              />
            }
          />

          <Route
            path="/login"
            element={
              <Login />
            }
          />

          <Route
            path="/admin"
            element={
              <Admin
                authorized={admin}
              />
            }
          />
        </Routes>
      )}
    </Shell>
  );
}
