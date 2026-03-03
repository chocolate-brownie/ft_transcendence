import TournamentCard from "./TournamentCard";
import type { TournamentListItem } from "../../services/tournament.service";

interface TournamentListProps {
  tournaments: TournamentListItem[];
  joiningTournamentId: number | null;
  isUserParticipant: (tournament: TournamentListItem) => boolean;
  onJoin: (id: number) => Promise<void>;
  onView: (id: number) => void;
}

export default function TournamentList({
  tournaments,
  joiningTournamentId,
  isUserParticipant,
  onJoin,
  onView,
}: TournamentListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onJoin={onJoin}
          onView={onView}
          isUserParticipant={isUserParticipant(tournament)}
          isJoining={joiningTournamentId === tournament.id}
        />
      ))}
    </div>
  );
}
