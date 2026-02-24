# App Flow Document

## Onboarding and Sign-In/Sign-Up

A brand-new visitor lands on the application by typing the public URL into their browser or following a shared link. The landing page welcomes them with a clear header showing the platform name and two prominent buttons labeled "Sign Up" and "Log In". When the user clicks "Sign Up", they arrive at a registration page where they enter a display name, email address, and password. After submitting, the system checks for existing accounts and gives immediate feedback if the email is already in use. On successful registration, the user’s account is created in the database, a JSON Web Token is issued, and the user is automatically redirected to the main dashboard.

If the visitor clicks "Log In" instead, they see fields for email and password. After entering valid credentials, the system verifies them against stored hashed passwords and issues a fresh token upon success. Should the user forget their password, a "Forgot Password?" link takes them to a recovery page. There they enter their registered email, receive a time-limited reset link, and use that link to set a new password. Once the reset is confirmed, they can log in normally. At any time when authenticated, the user can find a "Log Out" option in the profile dropdown, which clears their token and returns them to the landing page.

## Main Dashboard or Home Page

Immediately after logging in, the user sees the main dashboard. A fixed sidebar on the left lists navigation options labeled Play Online, Play vs AI, Local Match, Friends, Tournaments, Leaderboard, and Profile. At the top a header displays the user’s avatar and name, with a dropdown for quick access to settings and log out. The central area shows dynamic widgets: pending friend requests with accept or decline buttons, active game invitations, upcoming tournament slots, and a big “Quick Start” button for matchmaking. Notifications appear as small badges on the sidebar items to guide the user toward new events. From this dashboard, a single click brings the user into any major feature of the application.

## Detailed Feature Flows and Page Transitions

### Online Multiplayer Matchmaking
When the user clicks Play Online, the sidebar highlight moves to that section and the main pane changes to a matchmaking view. Here the user sees a message indicating they are waiting for an opponent and a cancel button. The client uses Socket.io to emit a join request into the matchmaking queue. Once another player is found, the server creates a private match room and emits a “start game” event. Both clients receive this event and automatically transition to the game board page.

On the game board page, the Tic-Tac-Toe grid appears in the center with the two players’ names at the top. A chat panel sits to the right, showing past messages, a typing indicator, and a text box for new messages. When it is a player’s turn, their interface highlights the board and waits for a click on an empty cell. The client sends a move event to the server, which validates the move, updates the shared game state in the database, and broadcasts the new board to both players. This loop continues until a win or draw is detected. The server then updates each player’s win/loss/draw statistics, closes the room, and sends an end-of-game event. The clients display the result and offer buttons to return to the dashboard or play again.

### AI Opponent Mode
Selecting Play vs AI opens a difficulty selection panel on the main area. The user picks Easy, Medium, or Hard. Easy mode chooses random empty cells, Medium mixes random and limited-depth Minimax, and Hard runs full Minimax with pruning. After choosing, the user clicks "Start" and the page transitions to a layout similar to the multiplayer board, but with no chat panel. The same move events occur, now validated by the server’s AI engine. When the game finishes, the user sees a summary of the match outcome and can choose to retry or go back to the dashboard.

### Local Hot-Seat Match
Clicking Local Match immediately loads a board view that prompts Player X to make the first move. On each turn, the screen clearly displays which player’s turn it is below the grid. There is no network communication since the game runs entirely in the browser. Once the game ends, the result appears, and the user can restart or return to the dashboard.

### Friend Management and Chat
When the user clicks Friends, the central area lists current friends with their status icons indicating online, offline, or in-game. At the top there is a search field to enter another user’s display name or email and send a friend request. Incoming requests trigger a badge on the Friends link and appear as cards in the sidebar widget on the dashboard. Accepting or rejecting updates the friend list and sends a real-time notification to the other user via WebSockets. Within any game or the main dashboard, the user can open a chat window with a friend, view message history loaded from the database, compose new messages, and see when the friend is typing.

### Tournament Bracket System
Navigating to Tournaments shows a list of open tournaments with Join buttons. Clicking Join reserves a spot and updates the bracket view once the tournament starts. The bracket displays all match pairings and the user’s position. As matches progress, results auto-populate. Clicking on an active match entry transitions to the same game board layout used for multiplayer, with the addition of tournament round labels. After each match, the bracket updates and the user can see who they will face next or return to the dashboard.

### Leaderboard and Statistics
The Leaderboard page presents a ranked table of players sorted by win rate. Above it, a user-specific statistics panel shows total games played, wins, losses, and draws. This page uses pagination or infinite scroll to manage large data sets. Clicking a username transitions to that player’s public profile view, showing their match history and avatar.

### Profile Editing
Choosing Profile opens a page with fields for display name, avatar upload, and optional bio. Users can also view their personal match history with links to replay games. After making changes, clicking Save sends a request to update the user record in the database. A success message appears, and the new avatar and name immediately update in the header and sidebar. A link on this page also leads to Password Settings for changing the account password.

## Settings and Account Management

Under the profile dropdown in the header, the user finds Settings. On this page they can update notification preferences, enable or disable email notifications for friend requests or tournament invites, and choose whether in-game sounds play. In the Password Settings section, they enter their current password, choose a new one, and confirm. If the current password is incorrect, an error appears inline and the password stays unchanged. After a successful update, the user sees a confirmation message. A link at the bottom of Settings always returns them to the main dashboard or to a previously open section.

## Error States and Alternate Paths

If the user enters invalid data on any form—such as an improperly formatted email or a password that is too short—inline error messages appear next to the relevant field. During matchmaking, if the connection to the WebSocket server drops, the UI shows a banner stating "Connection lost. Reconnecting..." and Socket.io automatically attempts reconnection. If reconnection fails after a short timeout, the user is offered a button to return to the dashboard. Attempting to access any protected page without a valid token redirects the user to the login page with a note that their session has expired. Trying to join a full tournament or sending a duplicate friend request triggers a server-generated error message displayed at the top of the page in a red box. All error messages include a clear retry or back link so the user can quickly regain a normal flow.

## Conclusion and Overall App Journey

From the moment a new visitor arrives at the landing page to the point where they become a regular player, the application guides them through a clear series of steps. They sign up, verify their account, and land on a personalized dashboard that makes it easy to jump into a game, manage friends, or start a tournament. Core features like online matches, AI games, and local play all reuse a consistent board interface. Social elements such as chat and friend requests integrate seamlessly with real-time updates. Throughout their time on the platform, users can adjust settings, recover lost passwords, and view detailed statistics. Error conditions are handled gracefully, ensuring they always know what went wrong and how to continue. With a complete flow from sign-up to competitive play and back to the dashboard, the user experience remains cohesive and engaging at every turn.

## ASCII Flowchart

     +-------------+      +------------+      +-----------+
     | Landing page| ---> | Sign Up    | ---> | Dashboard |
     |  or Log In  |      |  / Log In  |      |  (Home)   |
     +------+------+      +------+-----+      +-----+-----+
            |                    |                  |
            |                    |                  |
            v                    v                  v
     +-------------+      +----------------+   +----------+
     |Forgot Password|    | Token stored   |   | Sidebar  |
     |   / Reset    |    |  redirect to   |   | Navigation|
     +------+------+    |  Dashboard     |   +-----+----+
            |           +----------------+         |
            v                                     |
     +----------------+                           |
     | Password Reset |                           |
     |   Confirmation |                           |
     +----------------+                           |
                                                 |
                    +------------------------+   |
                    | Choose Feature in      |<--+
                    | Sidebar (Play Online,  |
                    | Play vs AI, Local,     |
                    | Friends, Tournaments,   |
                    | Leaderboard, Profile)   |
                    +-----------+------------+
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
   +---------------+   +---------------+   +---------------+
   | Online Match  |   | AI Match      |   | Local Match   |
   +-------+-------+   +-------+-------+   +-------+-------+
           |                   |                   |
           v                   v                   v
   +---------------+   +---------------+   +---------------+
   | Game Board    |   | Game Board    |   | Game Board    |
   | + Chat Panel  |   | (AI Engine)   |   | (Hot Seat)    |
   +-------+-------+   +---------------+   +---------------+
           |                                          |
           v                                          v
   +---------------+                         +----------------+
   | Show Result & |                         | Show Result & |
   | Update Stats  |                         | Restart option|
   +-------+-------+                         +----------------+
           |
           v
   +---------------+
   | Return to     |
   | Dashboard     |
   +---------------+