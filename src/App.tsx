import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Coffee,
  FileText,
  ListChecks,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';

type Task = {
  id: number;
  title: string;
  note?: string;
  tag: '待办' | '已完成' | '打卡';
  done: boolean;
};

type Habit = {
  id: number;
  title: string;
  time: string;
  checked: boolean;
};

const petImages = [
  '/images/image copy 2.png',
  '/images/image copy 3.png',
  '/images/image copy 4.png',
];

const petMoods = [
  '慢慢来，今天也会很棒。',
  '收到！我帮你记下啦。',
  '别忘了，休息也是任务的一部分。',
];

const initialTasks: Task[] = [
  { id: 1, title: '完成周报并发送给组长', note: '今天 18:00 前', tag: '待办', done: false },
  { id: 2, title: '整理桌面与下载文件夹', note: '整理一下思绪', tag: '待办', done: false },
  { id: 3, title: '喝一杯温水', note: '给自己 5 分钟休息', tag: '已完成', done: true },
];

const initialHabits: Habit[] = [
  { id: 1, title: '早起打卡', time: '08:00', checked: true },
  { id: 2, title: '午间拉伸', time: '12:30', checked: false },
  { id: 3, title: '阅读 30 分钟', time: '21:00', checked: false },
];

function loadStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadStored('desk-pet-tasks', initialTasks));
  const [habits, setHabits] = useState<Habit[]>(() => loadStored('desk-pet-habits', initialHabits));
  const [activeTab, setActiveTab] = useState<'tasks' | 'done' | 'habits'>('tasks');
  const [newTask, setNewTask] = useState('');
  const [petIndex, setPetIndex] = useState(0);
  const [petMood, setPetMood] = useState(petMoods[0]);
  const [showBubble, setShowBubble] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('09:00');

  useEffect(() => localStorage.setItem('desk-pet-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('desk-pet-habits', JSON.stringify(habits)), [habits]);

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const today = useMemo(() => {
    const now = new Date();
    return {
      date: `${now.getMonth() + 1}月${now.getDate()}日`,
      weekday: new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now),
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
  }, []);

  const cyclePet = () => {
    const next = (petIndex + 1) % petImages.length;
    const mood = petMoods[next % petMoods.length];
    setPetIndex(next);
    setPetMood(mood);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 2800);
  };

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((cur) => [{ id: Date.now(), title, note: '刚刚添加', tag: '待办', done: false }, ...cur]);
    setNewTask('');
    setPetMood('收到！我帮你记下啦。');
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 2800);
  };

  const toggleTask = (id: number) => {
    setTasks((cur) => cur.map((t) => t.id === id ? { ...t, done: !t.done, tag: t.done ? '待办' : '已完成' } : t));
    setPetMood('做得漂亮！又完成一件小事。');
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 2800);
  };

  const deleteTask = (id: number) => setTasks((cur) => cur.filter((t) => t.id !== id));

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits((cur) => [...cur, { id: Date.now(), title: newHabit.trim(), time: newHabitTime, checked: false }]);
    setNewHabit('');
    setShowAddHabit(false);
  };

  const toggleHabit = (id: number) => setHabits((cur) => cur.map((h) => h.id === id ? { ...h, checked: !h.checked } : h));

  if (!isWidgetOpen) {
    return (
      <main className="app-shell">
        <button className="collapsed-pet" onClick={() => setIsWidgetOpen(true)} aria-label="恢复面板">
          <img src={petImages[petIndex]} alt="点击打开桌宠" />
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="widget-wrapper">
        {/* 桌宠悬浮在卡片左上角 */}
        <button className="pet-anchor" onClick={cyclePet} aria-label="切换桌宠形象">
          <img src={petImages[petIndex]} alt="可爱的桌宠" className="pet-img" />
          {showBubble && (
            <div className="speech-bubble">
              <span className="bubble-dot" />
              {petMood}
            </div>
          )}
        </button>

        <section className="widget" aria-label="清单桌宠">
          {/* 顶栏 */}
          <div className="widget-topbar">
            <div className="window-dots">
              <button className="dot dot-min" aria-label="最小化" onClick={() => setIsWidgetOpen(false)}><Minus size={11} /></button>
              <button className="dot dot-close" aria-label="关闭" onClick={() => setIsWidgetOpen(false)}><X size={11} /></button>
            </div>
            <div className="topbar-datetime">
              <span className="topbar-time">{today.time}</span>
              <span className="topbar-date">{today.date} {today.weekday}</span>
            </div>
          </div>

          {/* 进度 */}
          <div className="progress-panel">
            <div className="progress-copy">
              <span>待办进度 {completed}/{tasks.length}</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
          </div>

          {/* 标签页 */}
          <div className="tabs">
            <button className={activeTab === 'tasks' ? 'tab active' : 'tab'} onClick={() => setActiveTab('tasks')}><ListChecks size={14} /> 待办</button>
            <button className={activeTab === 'done' ? 'tab active tab-done' : 'tab'} onClick={() => setActiveTab('done')}><CheckCheck size={14} /> 已完成</button>
            <button className={activeTab === 'habits' ? 'tab active' : 'tab'} onClick={() => setActiveTab('habits')}><CalendarDays size={14} /> 打卡</button>
          </div>

          {/* 内容区 */}
          {activeTab === 'tasks' ? (
            <div className="content-area">
              <div className="task-list">
                {tasks.filter((t) => !t.done).length === 0 && (
                  <div className="empty-state"><Coffee size={20} /><span>太棒了，待办全部完成啦！</span></div>
                )}
                {tasks.filter((t) => !t.done).map((task) => (
                  <article className="task-card" key={task.id}>
                    <button className="check-circle" aria-label="完成" onClick={() => toggleTask(task.id)} />
                    <span className="task-title">{task.title}</span>
                    <button className="delete-button" aria-label="删除" onClick={() => deleteTask(task.id)}><X size={14} /></button>
                  </article>
                ))}
              </div>
              <div className="add-row">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="新增待办"
                />
                <button onClick={addTask} aria-label="添加"><Plus size={18} /></button>
              </div>
            </div>
          ) : activeTab === 'done' ? (
            <div className="content-area">
              <div className="task-list">
                {tasks.filter((t) => t.done).length === 0 && (
                  <div className="empty-state"><CheckCheck size={20} /><span>还没有完成的任务，加油！</span></div>
                )}
                {tasks.filter((t) => t.done).map((task) => (
                  <article className="task-card is-done" key={task.id}>
                    <button className="check-circle" aria-label="撤销完成" onClick={() => toggleTask(task.id)}>
                      <Check size={13} />
                    </button>
                    <span className="task-title">{task.title}</span>
                    <button className="delete-button" aria-label="删除" onClick={() => deleteTask(task.id)}><X size={14} /></button>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="content-area">
              <div className="habit-list">
                {habits.map((habit) => (
                  <article className={habit.checked ? 'habit-card is-checked' : 'habit-card'} key={habit.id}>
                    <button className="habit-check" onClick={() => toggleHabit(habit.id)} aria-label="打卡">
                      {habit.checked ? <Check size={13} /> : null}
                    </button>
                    <div className="habit-info">
                      <strong>{habit.title}</strong>
                      <span><Bell size={11} /> 每天 {habit.time}</span>
                    </div>
                    <ChevronRight size={15} />
                  </article>
                ))}
              </div>
              {showAddHabit ? (
                <div className="habit-form">
                  <input autoFocus value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHabit()} placeholder="习惯名称" />
                  <input type="time" value={newHabitTime} onChange={(e) => setNewHabitTime(e.target.value)} />
                  <button onClick={addHabit}>保存</button>
                </div>
              ) : (
                <button className="add-habit" onClick={() => setShowAddHabit(true)}><Plus size={15} /> 新增打卡习惯</button>
              )}
            </div>
          )}

          <footer className="widget-footer">
            <span><FileText size={13} /> 数据已自动保存</span>
            <button onClick={() => { setPetMood('别忘了，休息也是任务的一部分。'); setShowBubble(true); setTimeout(() => setShowBubble(false), 2800); }}>
              <RotateCcw size={13} /> 换个心情
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default App;
