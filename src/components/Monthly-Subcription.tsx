import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const SubscriptionForm: React.FC<{ priceId: string }> = ({ priceId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: stripeError, paymentMethod } =
      await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

    if (stripeError) {
      setError(stripeError.message || "");
      setLoading(false);
    } else {
      const response = await fetch("/api/monthly-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "customer@example.com", // Replace with actual customer's email
          paymentMethodId: paymentMethod.id,
          priceId: priceId,
        }),
      });

      const subscription = await response.json();

      if (subscription.error) {
        setError(subscription.error);
        setLoading(false);
      } else {
        setError(null);
        setLoading(false);
        console.log("Subscription successful", subscription);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded px-8 pt-6 pb-8"
    >
      <h2 className="text-2xl font-semibold mb-4">
        Subscribe Now - Price: ${(2000 / 100).toFixed(2)}
      </h2>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="card-element"
        >
          Credit or Debit Card
        </label>
        <div className="border rounded p-2">
          <CardElement />
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition duration-200 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Subscribe"}
      </button>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </form>
  );
};

const MonthlySubscriptionPage: React.FC = () => {
  const [priceId, setPriceId] = useState<string>("");

  const createProductAndPrice = async () => {
    const response = await fetch("/api/create-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    if (!response.ok) {
      console.error(data.error);
      return;
    }

    setPriceId(data.priceId);
  };

  useEffect(() => {
    createProductAndPrice();
  }, []);

  return (
    <Elements stripe={stripePromise}>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex max-w-6xl w-full bg-white shadow-lg rounded-lg">
          {/* Your information section can remain here */}
          <div className="w-1/2 p-10 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">
              Welcome to Our Subscription Service!
            </h2>
            <p className="mb-6">
              Join our community and enjoy unlimited access to exclusive content
              and features.
            </p>
            <p className="text-gray-500">
              Don't miss out on the opportunity to enhance your journey with us!
            </p>
          </div>

          {/* Right Side: Subscription Form */}
          <div className="w-1/2 p-10">
            {priceId ? (
              <SubscriptionForm priceId={priceId} />
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </div>
    </Elements>
  );
};

export default MonthlySubscriptionPage;
