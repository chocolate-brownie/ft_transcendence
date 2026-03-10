# Database Schema — ft_transcendence

```mermaid
erDiagram
    USER {
        int id PK
        string email UK
        string username UK
        string password_hash
        string avatar_url
        string display_name
        boolean is_online
        int wins
        int losses
        int draws
        datetime created_at
        datetime updated_at
    }

    GAME {
        int id PK
        int player1_id FK
        int player2_id FK
        int winner_id FK
        json board_state
        int board_size
        string current_turn
        enum game_type
        enum difficulty
        enum status
        string player1_symbol
        string player2_symbol
        json winning_line
        int tournament_id FK
        datetime started_at
        datetime finished_at
        datetime created_at
    }

    FRIEND {
        int id PK
        int requester_id FK
        int addressee_id FK
        enum status
        datetime created_at
    }

    MESSAGE {
        int id PK
        int sender_id FK
        int receiver_id FK
        string content
        boolean read
        datetime created_at
    }

    TOURNAMENT {
        int id PK
        string name
        enum status
        int max_players
        int current_round
        int created_by_id FK
        int winner_id FK
        datetime started_at
        datetime finished_at
        datetime created_at
    }

    TOURNAMENT_PARTICIPANT {
        int id PK
        int tournament_id FK
        int user_id FK
        int seed
        int eliminated_in_round
        datetime joined_at
    }

    TOURNAMENT_MATCH {
        int id PK
        int tournament_id FK
        int round
        int match_number
        int player1_id FK
        int player2_id FK
        int winner_id FK
        int game_id FK
        datetime completed_at
    }

    USER ||--o{ GAME : "plays as player1"
    USER ||--o{ GAME : "plays as player2"
    USER ||--o{ GAME : "wins"
    USER ||--o{ FRIEND : "sends request"
    USER ||--o{ FRIEND : "receives request"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ MESSAGE : "receives"
    USER ||--o{ TOURNAMENT_PARTICIPANT : "joins"
    USER ||--o{ TOURNAMENT : "creates"
    USER ||--o{ TOURNAMENT : "wins"
    USER ||--o{ TOURNAMENT_MATCH : "plays as player1"
    USER ||--o{ TOURNAMENT_MATCH : "plays as player2"
    USER ||--o{ TOURNAMENT_MATCH : "wins"

    TOURNAMENT ||--o{ TOURNAMENT_PARTICIPANT : "has"
    TOURNAMENT ||--o{ TOURNAMENT_MATCH : "has"
    TOURNAMENT ||--o{ GAME : "contains"

    TOURNAMENT_MATCH ||--o| GAME : "links to"
```

---

## Legend

| Symbol      | Meaning                                |
| ----------- | -------------------------------------- |
| `PK`        | Primary key                            |
| `FK`        | Foreign key                            |
| `UK`        | Unique constraint                      |
| `\|\|--o{`  | One-to-many (required → optional many) |
| `\|\|--o\|` | One-to-one (optional)                  |

## Enums

| Field               | Values                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `game_type`         | `CLASSIC`, `CUSTOM`, `TOURNAMENT`, `AI`                                |
| `game.status`       | `WAITING`, `IN_PROGRESS`, `FINISHED`, `DRAW`, `CANCELLED`, `ABANDONED` |
| `difficulty`        | `EASY`, `MEDIUM`, `HARD`                                               |
| `friend.status`     | `PENDING`, `ACCEPTED`, `BLOCKED`                                       |
| `tournament.status` | `REGISTERING`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`                  |
| `board_size`        | `3` (3×3), `4` (4×4), `5` (5×5)                                        |
