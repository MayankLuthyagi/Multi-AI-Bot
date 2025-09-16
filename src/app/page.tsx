import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 py-8 lg:px-8">
      <div className="w-full max-w-7xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 lg:mb-8">
            Welcome to <span className="text-emerald-400">Multibot</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
            Power up your workflow with smarter conversations, multiple AI
            models, and enterprise-grade privacy — all in one place.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16 max-w-6xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-lg p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-white mb-3">
              Multiple AI Models
            </h3>
            <p className="text-gray-400 lg:text-lg leading-relaxed">
              Explore and switch between different AI brains instantly.
            </p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-lg p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-white mb-3">
              Smart Assistance
            </h3>
            <p className="text-gray-400 lg:text-lg leading-relaxed">
              Boost productivity with AI that understands your needs.
            </p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-lg p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 text-pink-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-white mb-3">
              Secure & Private
            </h3>
            <p className="text-gray-400 lg:text-lg leading-relaxed">
              Conversations are encrypted and always stay yours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
