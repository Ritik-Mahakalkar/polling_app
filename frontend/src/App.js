import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const api = axios.create({ baseURL: "http://localhost:5000" });

const PollList = () => {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    api.get("/polls").then((res) => setPolls(res.data));
  }, []);

  return (
    <div>
      {polls.map((poll) => (
        <div className="poll-card" key={poll.id}>
          <p>{poll.question}</p>
          <Link to={`/vote/${poll.id}`}>Vote</Link> |{" "}
          <Link to={`/results/${poll.id}`}>View Results</Link>
        </div>
      ))}
    </div>
  );
};

const CreatePoll = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const navigate = useNavigate();

  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim());
    if (question && validOptions.length >= 2) {
      await api.post("/polls", { question, options: validOptions, created_by: 1 });
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Poll question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {options.map((opt, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={`Option ${idx + 1}`}
          value={opt}
          onChange={(e) => updateOption(idx, e.target.value)}
        />
      ))}
      {options.length < 5 && (
        <button type="button" onClick={addOption}>+ Add Option</button>
      )}
      <button type="submit">Create Poll</button>
    </form>
  );
};

const VotePoll = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/polls/${id}`).then((res) => setPoll(res.data));
  }, [id]);

  const vote = async () => {
    if (selected) {
      await api.post(`/polls/${id}/vote`, { user_id: 1, option_id: selected });
      navigate(`/results/${id}`);
    }
  };

  if (!poll) return <p>Loading...</p>;

  return (
    <div>
      <h2>{poll.poll.question}</h2>
      {poll.options.map((opt) => (
        <label className="radio-label" key={opt.id}>
          <input
            type="radio"
            name="option"
            value={opt.id}
            onChange={() => setSelected(opt.id)}
          />
          {opt.option_text}
        </label>
      ))}
      <button onClick={vote} disabled={!selected}>Vote</button>
    </div>
  );
};

const PollResults = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get(`/polls/${id}/results`).then((res) => setResults(res.data));
  }, [id]);

  const chartData = {
    labels: results.map(r => r.option_text),
    datasets: [
      {
        label: "Votes",
        data: results.map(r => r.vote_count),
        backgroundColor: "rgba(0, 123, 255, 0.5)"
      }
    ]
  };

  return (
    <div>
      <h2>Results</h2>
      <Bar data={chartData} />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <h1>Polling App</h1>
      <nav>
        <Link to="/">Polls</Link>
        <Link to="/create">Create Poll</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PollList />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/vote/:id" element={<VotePoll />} />
        <Route path="/results/:id" element={<PollResults />} />
      </Routes>
    </Router>
  );
}
