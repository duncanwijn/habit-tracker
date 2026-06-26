import Navbar from '../components/Navbar.jsx'
import HabitView from '../components/HabitView.jsx'

export default function HomePage() {
  console.log('[HomePage] rendering');
  return (
    <>
    <div className="App">
    {/* 1. Global Navigation */}
    <Navbar />
    <main className="main-content">
      <HabitView />
    </main>  
    </div>
    </>
  )
}
