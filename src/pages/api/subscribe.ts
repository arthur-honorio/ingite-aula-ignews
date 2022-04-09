import { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react"
import { fauna } from "../../services/faunadb"
import { query as q } from "faunadb"
import { stripe } from "../../services/stripe"

type User = {
  ref: { id: string }
  data: { stripe_checkout_id: string }
}

export default async function oi(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await getSession({ req })

    const faunaUser = await fauna.query<User>(
      q.Get(q.Match(q.Index("user_by_email"), session.user.email))
    )

    let faunaCustomerId = faunaUser.data.stripe_checkout_id

    if (!faunaCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        // metadata
      })

      await fauna.query(
        q.Update(q.Ref(faunaUser.ref), {
          data: {
            stripe_checkout_id: stripeCustomer.id,
          },
        })
      )

      faunaCustomerId = stripeCustomer.id
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      billing_address_collection: "required",
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer: faunaCustomerId,
      line_items: [{ price: "price_1KXYsZJihl7RW1AeUzG38TC7", quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card"],
      success_url: process.env.STRIPE_SUCCESS_URL,
    })

    return res.status(200).json({ sessionId: stripeCheckoutSession.id })
  } else {
    res.setHeader("Allow", "POST")
    res.status(405).end("Method not allowed")
  }
}
