import type { NavPreferences, PayloadRequest } from 'payload'

import { cache } from 'react'

export const getNavPrefs = cache(
  async (req: PayloadRequest | undefined): Promise<NavPreferences | null> => {
    return req?.user?.collection
      ? await req.payload
          .find({
            collection: 'payload-preferences',
            depth: 0,
            limit: 1,
            pagination: false,
            req,
            where: {
              and: [
                {
                  key: {
                    equals: 'nav',
                  },
                },
                {
                  'user.relationTo': {
                    equals: req.user.collection,
                  },
                },
                {
                  'user.value': {
                    equals: req?.user?.id,
                  },
                },
              ],
            },
          })
          // `value` is untyped JSON in the generated types; this key always holds nav preferences
          ?.then((res) => (res?.docs?.[0]?.value as NavPreferences | undefined) ?? null)
      : null
  },
)
