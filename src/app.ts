/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedMap } from "fluid-framework";
import { AzureClient, AzureClientProps, LOCAL_MODE_TENANT_ID } from "@fluidframework/azure-client";
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

//
// Service Config for Azure

import { ITokenProvider, ITokenResponse } from "@fluidframework/azure-client";
import axios from "axios"
export class AzureFunctionTokenProvider implements ITokenProvider {
  constructor(
    private readonly azFunctionUrl: string,
    private readonly userId: string,
    private readonly userName: string,
  ){

  }

  public async fetchOrdererToken(tenantId: string, documentId: string): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    public async fetchStorageToken(tenantId: string, documentId: string): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    private async getToken(tenantId: string, documentId: string): Promise<string> {
        const params = {
            tenantId,
            documentId,
            userId: this.userId,
            userName: this.userName,
        };
        const token = this.getTokenFromServer(params);
        return token;
    }

    private async getTokenFromServer(input: any): Promise<string> {
        // The example below uses the axios library to make HTTP requests. You can use other libraries or approaches to making an HTTP request.
        return axios.get(this.azFunctionUrl, {
            params: input,
        }).then((response) => {
            return response.data as string;
        }).catch((err) => {
            return err as string;
        });
    }
}

// the keys file is excluded from source control since these shouldn't be checked in.
import {azureFunctionUrl, tenantId, orderer, storage } from "./keys";

// Replace with Azure Function URL
// "myAzureFunctionUrl" + "/api/GetAzureToken"
const userId = "userId";
const userName = "Test User";



const serviceConfigAzure: AzureClientProps = {
    connection : {
        tenantId,
        tokenProvider: new AzureFunctionTokenProvider(
            //
            azureFunctionUrl,
            userId,
            userName
        ),
        orderer,
        storage,
    }
}

// Select service config to use
const serviceConfig: AzureClientProps = serviceConfigAzure;
//serviceConfigLocal;

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
