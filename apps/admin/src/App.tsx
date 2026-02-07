function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>MemoHack Admin Dashboard</h1>
      </header>
      <main className="dashboard">
        <nav className="sidebar">
          <ul>
            <li>Dashboard</li>
            <li>Users</li>
            <li>Chapters</li>
            <li>Settings</li>
          </ul>
        </nav>
        <section className="content">
          <h2>Dashboard</h2>
          <p>Admin dashboard content goes here...</p>
        </section>
      </main>
    </div>
  );
}

export default App;
