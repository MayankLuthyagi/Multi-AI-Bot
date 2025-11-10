export default function DashboardPage() {
    return (
        <div className="flex h-[calc(100vh-5rem)] justify-center bg-gray-100 dark:bg-zinc-900 font-sans">
            <div className="w-full items-start">
                {/* Scrollable section */}
                <div className="w-full h-5/6 bg-black flex space-x-1 border-b border-gray-300 dark:border-gray-600 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-800">
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">1</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">2</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">3</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">4</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">5</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">6</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">7</div>
                    <div className="w-1/6 h-full border-gray-300 bg-white flex-shrink-0 text-black">8</div>
                </div>

                {/* Bottom input bar */}
                <div className="w-full h-1/6 bg-black p-6 justify-center flex items-center border-t border-gray-300 dark:border-gray-600">
                    <input
                        className="w-180 py-1 px-4 rounded-full border border-gray-300 dark:border-gray-600"
                        type="text"
                        placeholder="Type here..."
                    />
                </div>
            </div>
        </div>
    );
}
