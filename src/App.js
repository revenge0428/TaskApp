import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';

import './App.css';

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDiATTA5ko7PI2SySCFHplflgVsn-kO1vI",
  authDomain: "awesome-project-88960.firebaseapp.com",
  databaseURL: "https://awesome-project-88960-default-rtdb.firebaseio.com",
  projectId: "awesome-project-88960",
  storageBucket: "awesome-project-88960.appspot.com",
  messagingSenderId: "13284418628",
  appId: "1:13284418628:web:0f29b3798ef3d80e2f8811"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider(db);


function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }

    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const updateTasksInterval = setInterval(() => {
      const now = new Date();
      const updatedTasks = tasks.map((task) =>
        task.dueDate && task.dueDate < now ? { ...task, completed: true } : task
      );
      setTasks(updatedTasks);
      updatedTasks.forEach((task) => {
        if (task.completed && !task.notificationShown) {
          showNotification(`Task Completed: ${task.text}`);
          task.notificationShown = true;
        } else if (task.dueDate && !task.completed && !task.notificationShown) {
          const timeDifference = task.dueDate - now;
          const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

          if (daysDifference === 1) {
            showNotification(`Task Due Tomorrow: ${task.text}`);
            task.notificationShown = true;
          }
        }
      });
    }, 60000);

    return () => clearInterval(updateTasksInterval); 
  }, [tasks]);

  const showNotification = (message) => {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(message);
    } else if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(message);
        }
      });
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profilePicture = 'https://imgs.search.brave.com/bFF8_xQy_-cBA55VIKAy68h8rgyZDOyvB5FXxL1xR5g/rs:fit:860:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzY1LzEwLzQ3/LzM2MF9GXzY1MTA0/NzE4X3gxN2E3Nnd6/V0tJbTNCbGhBNnV5/WVZrRHM5OTgyYzZx/LmpwZw';
      setUser({ username: user.displayName, profilePic: profilePicture });
    } catch (error) {
      console.error('Error signing in:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTasks([]);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const addTask = () => {
    if (newTask.trim() !== '' && dueDate.trim() !== '') {
      const newTasks = [
        ...tasks,
        { id: Date.now(), text: newTask, completed: false, dueDate: new Date(dueDate) },
      ];
      setTasks(newTasks);
      setNewTask('');
      setDueDate('');
    }
  };

  const editTask = () => {
    if (selectedTask && (newTask.trim() !== '' || dueDate.trim() !== '')) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              text: newTask.trim() !== '' ? newTask : task.text,
              dueDate: dueDate.trim() !== '' ? new Date(dueDate) : task.dueDate,
              notificationShown: false,
            }
          : task
      );
      setTasks(updatedTasks);
      setNewTask('');
      setDueDate('');
      setSelectedTask(null);

      showNotification(`Task Updated: ${selectedTask.text}`);
    }
  };

  const deleteTask = (taskId) => {
    const deletedTask = tasks.find((task) => task.id === taskId);
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
    setSelectedTask(null);

    showNotification(`Task Deleted: ${deletedTask.text}`);
  };

  const toggleTaskCompleted = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed, notificationShown: false } 
        : task
    );
    setTasks(updatedTasks);

    const completedTask = updatedTasks.find(
      (task) => task.id === taskId && task.completed && !task.notificationShown
    );
    if (completedTask) {
      showNotification(`Task Completed: ${completedTask.text}`);
      completedTask.notificationShown = true;
    }
  };

  const checkDueDate = (dueDate) => {
    const now = new Date();
    return dueDate < now;
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header>
        <h1>Task Manager</h1>
        {user ? (
          <div className="user-info">
            {user.profilePic && (
              <img src={user.profilePic} alt="Profile" className="profile-pic" width="100" height="100" />
            )}
            <p>Welcome, {user.username}!</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin}>Login</button>
        )}
        <label>
          Dark Mode
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        </label>
      </header>
      {user && (
        <div className="task-form">
          <input
            type="text"
            placeholder="Add a new task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <input
            type="date"
            placeholder="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {selectedTask ? (
            <button onClick={editTask}>Update Task</button>
          ) : (
            <button onClick={addTask}>Add Task</button>
          )}
        </div>
      )}
      <ul>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={task.completed || checkDueDate(task.dueDate) ? 'completed' : ''}
          >
            <div>
              <span className="task-indicator">Task Name:</span>
              <span className="task-name">{task.text}</span>
            </div>
            {task.dueDate && (
              <div>
                <span className={`due-date ${checkDueDate(task.dueDate) ? 'overdue' : ''}`}>
                  Due Date: {task.dueDate.toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <button onClick={() => toggleTaskCompleted(task.id)}>
                {task.completed ? 'Undo' : 'Complete'}
              </button>
              <button onClick={() => setSelectedTask(task)}>Edit</button>
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
