import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCheck,
  Coffee,
  FileText,
  ListChecks,
  Minus,
  MoreHorizontal,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { getStored, setStored } from './lib/storage';

type Task = {
  id: number;
  title: string;
  note?: string;
  tag: '待办' | '已完成' | '打卡';
  done: boolean;
  completedAt?: string;
  deadline?: string;
};

type Habit = {
  id: number;
  title: string;
  time?: string;
  checked: boolean;
  startDate: string;
  days: number;
  lastCheckDate?: string;
};

const petImages = [
  '/images/image copy 2.png',
  '/images/image copy 3.png',
  '/images/image copy 4.png',
];

const petMoods = [

  '压力大的话就在地上躺一躺吧，增大受力面积，减小压强。',

  '烂工出烂活，欲速则一坨。',
  '废学忘习地寝食ing...',


];

const initialTasks: Task[] = [
  { id: 1, title: '完成周报并发送给组长', note: '今天 18:00 前', tag: '待办', done: false },
  { id: 2, title: '整理桌面与下载文件夹', note: '整理一下思绪', tag: '待办', done: false },
  { id: 3, title: '喝一杯温水', note: '给自己 5 分钟休息', tag: '已完成', done: true },
];

const initialHabits: Habit[] = [
  { id: 1, title: '早起打卡', time: '08:00', checked: true, startDate: new Date().toISOString(), days: 1, lastCheckDate: new Date().toISOString().slice(0, 10) },
  { id: 2, title: '午间拉伸', time: '12:30', checked: false, startDate: new Date().toISOString(), days: 0 },
  { id: 3, title: '阅读 30 分钟', time: '21:00', checked: false, startDate: new Date().toISOString(), days: 0 },
];

function normalizeHabits(raw: Habit[]): Habit[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return raw.map((h) => {
    const startDate = h.startDate ?? new Date().toISOString();
    const days = typeof h.days === 'number' ? h.days : (h.checked ? 1 : 0);
    const checked = h.checked && h.lastCheckDate === todayStr;
    return {
      ...h,
      startDate,
      days,
      checked,
      lastCheckDate: checked ? todayStr : h.lastCheckDate,
    };
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [habits, setHabits] = useState<Habit[]>(normalizeHabits(initialHabits));
  const [activeTab, setActiveTab] = useState<'tasks' | 'done' | 'habits'>('tasks');
  const [newTask, setNewTask] = useState('');
  const [petIndex, setPetIndex] = useState(0);
  const [petMood, setPetMood] = useState(petMoods[0]);
  const [showBubble, setShowBubble] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [newHabit, setNewHabit] = useState('');
  const [editingDeadlineId, setEditingDeadlineId] = useState<number | null>(null);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [tick, setTick] = useState(0);

  const petMovedRef = useRef(false);

  const startPetDrag = (e: React.MouseEvent) => {
    if (!window.electronAPI) return;
    petMovedRef.current = false;
    const startX = e.screenX;
    const startY = e.screenY;
    window.electronAPI.window.dragStart(startX, startY);

    const onMove = (ev: MouseEvent) => {
      if (Math.abs(ev.screenX - startX) > 2 || Math.abs(ev.screenY - startY) > 2) {
        petMovedRef.current = true;
      }
      window.electronAPI?.window.dragMove(ev.screenX, ev.screenY);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const today = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      date: `${now.getMonth() + 1}月${now.getDate()}日`,
      dateStr: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      weekday: new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now),
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedTasks, savedHabits] = await Promise.all([
        getStored<Task[]>('desk-pet-tasks', initialTasks),
        getStored<Habit[]>('desk-pet-habits', initialHabits),
      ]);
      if (!mounted) return;
      setTasks(savedTasks);
      setHabits(normalizeHabits(savedHabits));
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => setStored('desk-pet-tasks', tasks), [tasks]);
  useEffect(() => setStored('desk-pet-habits', habits), [habits]);

  useEffect(() => {
    setHabits((cur) => cur.map((h) => {
      if (h.checked && h.lastCheckDate !== today.dateStr) {
        return { ...h, checked: false };
      }
      return h;
    }));
  }, [today.dateStr]);

  useEffect(() => {
    const hasDeadline = tasks.some((t) => !t.done && t.deadline);
    if (!hasDeadline) return;
    const timer = setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(timer);
  }, [tasks]);

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const cyclePet = () => {
    const next = (petIndex + 1) % petImages.length;
    const mood = petMoods[next % petMoods.length];
    setPetIndex(next);
    setPetMood(mood);
    setShowBubble(true);
  };

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((cur) => [{ id: Date.now(), title, note: '刚刚添加', tag: '待办', done: false }, ...cur]);
    setNewTask('');
    setPetMood('收到！我帮你记下啦。');
    setShowBubble(true);
  };

  const toggleTask = (id: number) => {
    setTasks((cur) => cur.map((t) => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      return {
        ...t,
        done: nowDone,
        tag: nowDone ? '已完成' : '待办',
        completedAt: nowDone ? new Date().toISOString() : undefined,
      };
    }));
    setPetMood('做得漂亮！又完成一件小事。');
    setShowBubble(true);
  };

  const deleteTask = (id: number) => setTasks((cur) => cur.filter((t) => t.id !== id));

  const openDeadlineEditor = (task: Task) => {
    setEditingDeadlineId(task.id);
    if (task.deadline) {
      const d = new Date(task.deadline);
      const pad = (n: number) => String(n).padStart(2, '0');
      setDeadlineDraft(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setDeadlineDraft('');
    }
  };

  const saveDeadline = (id: number) => {
    if (!deadlineDraft) return;
    setTasks((cur) => cur.map((t) => t.id === id ? { ...t, deadline: new Date(deadlineDraft).toISOString() } : t));
    setEditingDeadlineId(null);
    setDeadlineDraft('');
  };

  const clearDeadline = (id: number) => {
    setTasks((cur) => cur.map((t) => t.id === id ? { ...t, deadline: undefined } : t));
    setEditingDeadlineId(null);
    setDeadlineDraft('');
  };

  const getDeadlineStatus = (task: Task): 'none' | 'near' | 'overdue' => {
    if (!task.deadline || task.done) return 'none';
    const diff = new Date(task.deadline).getTime() - Date.now();
    if (diff <= 0) return 'overdue';
    if (diff <= 2 * 60 * 60 * 1000) return 'near';
    return 'none';
  };

  const formatDeadline = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const formatStartDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const sortedPendingTasks = useMemo(() => {
    const priority: Record<'none' | 'near' | 'overdue', number> = { overdue: 0, near: 1, none: 2 };
    return tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => !task.done)
      .sort((a, b) => {
        const pa = priority[getDeadlineStatus(a.task)];
        const pb = priority[getDeadlineStatus(b.task)];
        if (pa !== pb) return pa - pb;
        return a.index - b.index;
      })
      .map(({ task }) => task);
  }, [tasks, tick]);

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits((cur) => [{ id: Date.now(), title: newHabit.trim(), checked: false, startDate: new Date().toISOString(), days: 0 }, ...cur]);
    setNewHabit('');
  };

  const toggleHabit = (id: number) => setHabits((cur) => cur.map((h) => {
    if (h.id !== id) return h;
    if (!h.checked) {
      return { ...h, checked: true, days: h.days + 1, lastCheckDate: today.dateStr };
    }
    return { ...h, checked: false, days: Math.max(0, h.days - 1), lastCheckDate: undefined };
  }));

  const deleteHabit = (id: number) => setHabits((cur) => cur.filter((h) => h.id !== id));

  if (!isWidgetOpen) {
    return (
      <main className="app-shell">
        <button
          className="collapsed-pet"
          onMouseDown={startPetDrag}
          onClick={() => { if (!petMovedRef.current) setIsWidgetOpen(true); }}
          aria-label="恢复面板"
        >
          <img src={petImages[petIndex]} alt="点击打开桌宠" />
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="widget-wrapper">
        {/* 桌宠悬浮在卡片左上角 */}
        <button
          className="pet-anchor"
          onMouseDown={startPetDrag}
          onClick={() => { if (!petMovedRef.current) cyclePet(); }}
          aria-label="切换桌宠形象"
        >
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
              <button className="dot dot-min" aria-label="最小化" onClick={() => setIsWidgetOpen(false)}><Minus size={8} /></button>
              <button className="dot dot-close" aria-label="关闭" onClick={() => { if (window.electronAPI) window.electronAPI.window.close(); else setIsWidgetOpen(false); }}><X size={8} /></button>
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
            <button className={activeTab === 'tasks' ? 'tab active' : 'tab'} onClick={() => setActiveTab('tasks')}><ListChecks size={11} /> 待办</button>
            <button className={activeTab === 'done' ? 'tab active tab-done' : 'tab'} onClick={() => setActiveTab('done')}><CheckCheck size={11} /> 已完成</button>
            <button className={activeTab === 'habits' ? 'tab active' : 'tab'} onClick={() => setActiveTab('habits')}><CalendarDays size={11} /> 打卡</button>
          </div>

          {/* 内容区 */}
          {activeTab === 'tasks' ? (
            <div className="content-area">
              <div className="task-list">
                {sortedPendingTasks.length === 0 && (
                  <div className="empty-state"><Coffee size={15} /><span>太棒了，待办全部完成啦！</span></div>
                )}
                {sortedPendingTasks.map((task) => {
                  const status = getDeadlineStatus(task);
                  const cardClass = status === 'overdue' ? 'task-card overdue' : status === 'near' ? 'task-card near-deadline' : 'task-card';
                  return (
                    <article className={cardClass} key={task.id}>
                      <button className="check-circle" aria-label="完成" onClick={() => toggleTask(task.id)} />
                      <div className="task-info">
                        <span className="task-title">{task.title}</span>
                        {task.deadline && (
                          <span className={status === 'overdue' ? 'task-deadline overdue' : status === 'near' ? 'task-deadline warning' : 'task-deadline'}>
                            <AlertTriangle size={8} />
                            {status === 'overdue' ? `已超时 ${formatDeadline(task.deadline)}` : `截止 ${formatDeadline(task.deadline)}`}
                          </span>
                        )}
                        {editingDeadlineId === task.id && (
                          <div className="deadline-editor">
                            <input
                              type="datetime-local"
                              value={deadlineDraft}
                              onChange={(e) => setDeadlineDraft(e.target.value)}
                            />
                            <div className="deadline-actions">
                              <button onClick={() => saveDeadline(task.id)} disabled={!deadlineDraft}>保存</button>
                              <button onClick={() => clearDeadline(task.id)} className="danger">清除</button>
                              <button onClick={() => { setEditingDeadlineId(null); setDeadlineDraft(''); }}>取消</button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="task-actions">
                        <button className="action-button" aria-label="设置提醒" onClick={() => openDeadlineEditor(task)}>
                          <MoreHorizontal size={11} />
                        </button>
                        <button className="delete-button" aria-label="删除" onClick={() => deleteTask(task.id)}><X size={11} /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="add-row">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="新增待办"
                />
                <button onClick={addTask} aria-label="添加"><Plus size={14} /></button>
              </div>
            </div>
          ) : activeTab === 'done' ? (
            <div className="content-area">
              <div className="task-list">
                {tasks.filter((t) => t.done).length === 0 && (
                  <div className="empty-state"><CheckCheck size={15} /><span>还没有完成的任务，加油！</span></div>
                )}
                {tasks.filter((t) => t.done).map((task) => (
                  <article className="task-card is-done" key={task.id}>
                    <button className="check-circle" aria-label="撤销完成" onClick={() => toggleTask(task.id)}>
                      <Check size={10} />
                    </button>
                    <div className="task-info">
                      <span className="task-title">{task.title}</span>
                      {task.completedAt && (
                        <span className="task-time">
                          完成于 {new Date(task.completedAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <button className="delete-button" aria-label="删除" onClick={() => deleteTask(task.id)}><X size={11} /></button>
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
                      {habit.checked ? <Check size={10} /> : null}
                    </button>
                    <div className="habit-info">
                      <strong>{habit.title}</strong>
                      <span className="habit-days">
                        从{formatStartDate(habit.startDate)}开始，你已经坚持打卡
                        <em className="habit-days-count">{habit.days}</em>
                        天啦！
                      </span>
                    </div>
                    <button className="delete-button" aria-label="删除" onClick={() => deleteHabit(habit.id)}><X size={11} /></button>
                  </article>
                ))}
              </div>
              <div className="add-row">
                <input
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="新增打卡习惯"
                />
                <button onClick={addHabit} aria-label="添加"><Plus size={14} /></button>
              </div>
            </div>
          )}

          <footer className="widget-footer">
            <span><FileText size={10} /> 今日事今日毕</span>
            <button onClick={() => { setPetMood('别忘了，休息也是任务的一部分。'); setShowBubble(true); }}>
              <RotateCcw size={10} /> 换个心情
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default App;