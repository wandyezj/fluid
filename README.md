# fluid
Play With Fluid

Fluid is only for simultaneous sessions. It does not persist data across sessions. Can any client act as a relay?

https://github.com/microsoft/FluidExamples


Can fluid work outside of a browser?

Same collaborative session needs the same container id

Possible to view members of the session and number of connections for each member.

Try to make a turn based game? One Machine needs to be the turn processor once all moves are submitted that then updates everyone with the final results. Woo Concurrent programming across the internet.

If want to prevent players from updating each others data or moves:
One Session for each player and the processor. Players submit their moves and the processors processes all sessions and then redistributes moves.


Should have full steps to productize includeing Azure Function Token Provider in the same template

Use TypeScript for everything

install extension for function instead

use azure CLI to set everything up or the VS Code Extension

note: for Azure Function App will need to enable CORS * since testing with localhost

Access-Control-Allow-Origin

https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings?tabs=portal
