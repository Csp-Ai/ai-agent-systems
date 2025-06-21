import React from 'react';

const tiers = [
  {
    title: 'Starter',
    price: 'Free',
    features: ['1 agent', 'Community support', 'Basic insights']
  },
  {
    title: 'Operator',
    price: '$49/mo',
    features: ['Up to 5 agents', 'Email support', 'Advanced analytics']
  },
  {
    title: 'Strategist',
    price: '$199/mo',
    features: ['Unlimited agents', 'Priority support', 'Custom reporting']
  }
];

const PricingTiers = () => (
  <div className="max-w-screen-xl mx-auto py-12 grid gap-8 md:grid-cols-3">
    {tiers.map(tier => (
      <div
        key={tier.title}
        className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 p-6 text-center"
      >
        <h3 className="text-xl font-semibold mb-2">{tier.title}</h3>
        <p className="text-3xl font-bold mb-4">{tier.price}</p>
        <ul className="space-y-1 mb-6">
          {tier.features.map(f => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
          Choose
        </button>
      </div>
    ))}
  </div>
);

export default PricingTiers;
