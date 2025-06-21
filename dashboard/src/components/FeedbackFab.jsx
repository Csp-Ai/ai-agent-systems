import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function FeedbackFab({ agent }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState('');
  const [text, setText] = useState('');
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(true), 5000);
    };
    reset();
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, []);

  const submit = async () => {
    try {
      await fetch('/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: location.pathname, agent, rating, text })
      });
      setOpen(false);
      setRating('');
      setText('');
      setThanks(true);
      setTimeout(() => setThanks(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {thanks && (
        <div className="fixed bottom-24 right-6 bg-green-600 text-white px-3 py-2 rounded shadow z-50">
          Thanks for your insight — it helps shape this platform.
        </div>
      )}
      {visible && (
        <button
          onClick={() => setOpen(true)}
          title="Give Feedback"
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40"
        >
          \u{1F4AC}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded p-4 w-80">
            <h3 className="text-lg mb-2">Give Feedback</h3>
            <div className="flex justify-center space-x-4 mb-2 text-2xl">
              {['😃','😐','😞'].map(e => (
                <button key={e} onClick={() => setRating(e)} className={rating===e?'':'opacity-50'}>{e}</button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Anything confusing or missing?"
              className="w-full border rounded p-2 mb-2 dark:bg-gray-700"
            />
            <div className="flex gap-2">
              <button onClick={submit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Submit</button>
              <button onClick={() => setOpen(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 rounded dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
