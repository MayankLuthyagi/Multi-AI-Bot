export const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-[#0D0D0D] text-white p-4 hidden lg:block">
      <h2 className="text-lg font-semibold mb-4">Sidebar</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Link 1
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Link 2
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="hover:underline">
              Link 3
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
