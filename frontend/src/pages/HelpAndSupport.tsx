const HelpAndSupport = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-700 mb-6">Help & Support</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium text-gray-900">How do I donate items?</h3>
            <p className="text-gray-600 mt-1">You can donate items by clicking on the 'Donate Now' button and filling out the donation form.</p>
          </div>
          {/* Add more FAQ items as needed */}
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p className="text-gray-600">Need further assistance? Reach out to our support team at support@donationapp.com</p>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;
