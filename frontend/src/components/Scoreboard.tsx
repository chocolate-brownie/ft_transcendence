import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User } from "../types/index"

/* Displays players' information under the Game board  */
type ScoreboardProps = {
  isMyTurn: boolean;
  waitForNewGame: boolean;
};

export const Scoreboard = ({isMyTurn, waitForNewGame}: ScoreboardProps): JSX.Element | null => {

  const { user } = useAuth();
  const myAvatar = user.avatarUrl ?? "/default-avatar.png";
  const myUsername = user?.username;

  // To set according to the opponent's info:
  let otherUsername = "nickname";
  let otherAvatar = "/default-avatar.png";

  // isMyTurn = false;
  if (!user) return (<span></span>);
  
  return (
      <div className={`
        rounded-lg bg-pong-surface py-2 shadow-sm
        ${waitForNewGame ? 'opacity-20' : ''}`}>
        <div className="flex items-center gap-8 text-pong-text/80">

          {/* Player 1 */}
          <div className="flex flex-col items-center w-28 gap-2">
            <span
              className={`
              font-semibold text-lg tracking-wide pb-2
              ${isMyTurn ? 'text-pong-accent' : 'text-pong-text/50'}
              `}>
              {isMyTurn ? "Plays" : "Waits..."}
            </span>
            {/* Image shadow changes if it is my turn or not */}
            <img
            className={
              isMyTurn
              ? "w-20 h-20 rounded-full object-cover shadow-[0_0_20px_5px_rgba(246,185,111,1)]"
              : "w-20 h-20 rounded-full object-cover opacity-70"
            }
            src={myAvatar}
            alt="your_avatar"
            />
    
            <div className="flex flex-row text-sm w-40 justify-center py-15"> 
              <span>
                {myUsername}
                <span className="text-pong-accent">
                  (X)
                </span>
              </span>
            </div>
          </div>


          {/* Ties (optionnel, comme sur ton screenshot) */}
          <div className="flex flex-col items-center px-7">
            <span className="text-xl font-semibold uppercase tracking-wide text-pong-text/50">
              VS
            </span>
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center w-28 gap-2">
            <span
              className={`
              font-semibold text-lg tracking-wide pb-2
              ${isMyTurn ? 'text-pong-text/50' : 'text-pong-secondary' }
              `}>
              {isMyTurn ? "Waits..." : "Plays" }
            </span>
            {/* Image shadow changes if it is my turn or not */}
            <img
            className={
              isMyTurn
              ? "w-20 h-20 rounded-full object-cover opacity-70"
              : "w-20 h-20 rounded-full object-cover shadow-[0_0_20px_5px_rgba(117,153,51,1)]"
            }
            // src={otherAvatar}
            src={myAvatar}
            alt="opponents_avatar"
            />
        <div className="flex flex-row text-sm w-40 justify-center py-15"> 
          <span>
            {otherUsername}
            <span className="text-pong-secondary">
              (O)
            </span>
          </span>
        </div>
        </div>

      </div>
    </div>
  );

};