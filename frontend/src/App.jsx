import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/Home';
import PostSessionSummary from './screens/PostSessionSummary';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post-session-summary" element={<PostSessionSummary />} />
      </Routes>
    </Router>
  );
}

export default App;

