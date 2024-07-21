import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FormEvent, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "");
      setLoading(false);
    } else {
      const response = await fetch("/api/payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1000 }), // Example amount in cents
      });

      const paymentIntent = await response.json();

      const { error: confirmError } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        setError(confirmError.message || "");
        setLoading(false);
      } else {
        console.log("Payment successful");
        setError(null);
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border p-2 rounded">
        <CardElement />
      </div>
      <button
        type="submit"
        className={`w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition duration-200 ${!stripe || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={!stripe || loading}
      >
        {loading ? "Processing..." : "Pay"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
};

const PaymentPage = () => (
  <Elements stripe={stripePromise}>
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Side: Info Section */}
      <div className="w-1/2 flex flex-col justify-center p-10 bg-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Secure Payment</h2>
        <p className="mb-6">
          Please fill in your card details to complete your purchase securely.
          We prioritize your privacy and ensure a safe transaction.
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>🔒 Your information is secured.</li>
          <li>🚀 Fast processing.</li>
          <li>💳 Multiple payment options.</li>
        </ul>
      </div>

      <div className="w-1/2 flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Enter Payment Details</h2>
          <CheckoutForm />
        </div>
      </div>
    </div>
  </Elements>
);

export default PaymentPage;
