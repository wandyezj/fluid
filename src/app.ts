/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedMap } from "fluid-framework";
import { AzureClient, LOCAL_MODE_TENANT_ID } from "@fluidframework/azure-client";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";

// The config is set to run against a local service by default. Run `npx tinylicious` to run locally
// Update the corresponding properties below with your tenant specific information to run against your tenant.
const serviceConfigLocal = {
    connection: {
        tenantId: LOCAL_MODE_TENANT_ID, // REPLACE WITH YOUR TENANT ID
        tokenProvider: new InsecureTokenProvider("" /* REPLACE WITH YOUR PRIMARY KEY */, {
            id: "userId",
        }),
        orderer: "http://localhost:7070", // REPLACE WITH YOUR ORDERER ENDPOINT
        storage: "http://localhost:7070", // REPLACE WITH YOUR STORAGE ENDPOINT
    },
};

// Service Config for Azure
// const serviceConfigAzure = {
//     connection : {
//         tenantId: "myTenantId",
//         tokenProvider: new AzureFunctionTokenProvider(
//             "myAzureFunctionUrl" + "/api/GetAzureToken",
//             { userId: "userId", userName: "Test User" }
//         ),
//         orderer: "https://myOrdererUrl",
//         storage: "https://myStorageUrl",
//     }
// }

// Select service config to use
const serviceConfig = serviceConfigLocal;

// creates and fetches containes
// creates an existing or loads a new one
const client = new AzureClient(serviceConfig);

const diceValueKey = "dice-value-key";

const containerSchema = {
    initialObjects: { diceMap: SharedMap },
};
const root = document.getElementById("content") as HTMLDivElement;

const createNewDice = async () => {
    const { container } = await client.createContainer(containerSchema);
    const diceMap  = container.initialObjects.diceMap as SharedMap;
    diceMap.set(diceValueKey, 1);
    const id = await container.attach();
    renderDiceRoller(diceMap, root);
    return id;
};

const loadExistingDice = async (id: string) => {
    const { container } = await client.getContainer(id, containerSchema);
    const diceMap  = container.initialObjects.diceMap as SharedMap;
    renderDiceRoller(diceMap, root);
};

async function start() {
    // Hash used as container id to sequence the container
    // sharing the URL shares the container
    if (location.hash) {
        await loadExistingDice(location.hash.substring(1));
    } else {
        const id = await createNewDice();
        location.hash = id;
    }
}

start().catch((error) => console.error(error));

// Define the view

const template = document.createElement("template");

template.innerHTML = `
  <style>
    .wrapper { text-align: center }
    .dice { font-size: 200px }
    .roll { font-size: 50px;}
  </style>
  <div class="wrapper">
    <div class="dice"></div>
    <button class="roll"> Roll </button>
  </div>
`;

const renderDiceRoller = (diceMap: SharedMap, elem: HTMLDivElement) => {
    elem.appendChild(template.content.cloneNode(true));

    const rollButton = elem.querySelector(".roll") as HTMLButtonElement;
    const dice = elem.querySelector(".dice") as HTMLDivElement;

    // Set the value at our dataKey with a random number between 1 and 6.
    if (rollButton) {
        rollButton.onclick = () => diceMap.set(diceValueKey, Math.floor(Math.random() * 6) + 1);
    }

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice = () => {
        const diceValue = diceMap.get(diceValueKey);

        if (dice) {
            // Unicode 0x2680-0x2685 are the sides of a dice (⚀⚁⚂⚃⚄⚅)
            dice.textContent = String.fromCodePoint(0x267f + diceValue);
            dice.style.color = `hsl(${diceValue * 60}, 70%, 30%)`;
        }
    };
    updateDice();

    // Use the changed event to trigger the rerender whenever the value changes.
    diceMap.on("valueChanged", updateDice);
};
