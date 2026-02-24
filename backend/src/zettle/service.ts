import { ofetch } from "ofetch";
import { PurchaseSchema } from "./schema";
import z from "zod";

type TokenInfo = {
  access_token: string;
  expires: Date;
};

const AUTH_BASE_URL = "https://oauth.zettle.com";
const PURCHASES_BASE_URL = "https://purchase.izettle.com";

export class ZettleAPI {
  private __token: TokenInfo | null = null;

  constructor(
    private clientId: string,
    private apiKey: string,
  ) {}

  async getToken() {
    const now = Date.now();
    if (this.__token && now < this.__token.expires.getTime()) {
      return this.__token.access_token;
    }

    const url = new URL("/token", AUTH_BASE_URL);

    const token_response = await ofetch<{
      access_token: string;
      expires_in: number;
    }>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: this.clientId,
        assertion: this.apiKey,
      }).toString(),
    });

    this.__token = {
      access_token: token_response.access_token,
      expires: new Date(now + (token_response.expires_in - 30) * 1000), // 30 seconds earlier
    };

    return this.__token.access_token;
  }

  async getPurchases({
    startDate,
    endDate,
    limit = 1000,
    purchaseHash,
  }: {
    startDate: Date;
    endDate: Date;
    limit?: number;
    purchaseHash?: string;
  }) {
    const token = await this.getToken();

    const url = new URL("/purchases/v2", PURCHASES_BASE_URL);
    url.searchParams.append("startDate", startDate.toISOString());
    url.searchParams.append("endDate", endDate.toISOString());
    url.searchParams.append("limit", String(limit));
    if (purchaseHash) {
      url.searchParams.append("lastPurchaseHash", purchaseHash);
    }

    const response = await ofetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  }

  async getAllPurchasesInRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }) {
    const allPurchases = [];

    const responseSchema = z.object({
      purchases: z.array(PurchaseSchema),
      lastPurchaseHash: z.string().optional().nullable(),
    });
    const LIMIT = 1000;

    const initialPurchases = responseSchema.parse(
      await this.getPurchases({
        startDate,
        endDate,
        limit: LIMIT,
      }),
    );

    console.log("Initial fetch", {
      startDate,
      endDate,
      limit: LIMIT,
      result: {
        count: initialPurchases.purchases.length,
        lastPurchaseHash: initialPurchases.lastPurchaseHash,
      },
    });

    if (initialPurchases.purchases.length < LIMIT - 2) {
      return initialPurchases.purchases;
    }

    allPurchases.push(...initialPurchases.purchases);

    let offset = initialPurchases.lastPurchaseHash ?? undefined;
    let lastResponse = initialPurchases;

    while (offset != null && lastResponse.purchases.length > 0) {
      const response = responseSchema.parse(
        await this.getPurchases({
          startDate,
          endDate,
          limit: LIMIT,
          purchaseHash: offset,
        }),
      );
      console.log("Pagination fetch", {
        startDate,
        endDate,
        limit: LIMIT,
        offset: offset,
        result: {
          count: response.purchases.length,
          lastPurchaseHash: response.lastPurchaseHash,
        },
      });

      allPurchases.push(...response.purchases);

      offset = response.lastPurchaseHash ?? undefined;
      lastResponse = response;
    }

    return allPurchases;
  }
}
