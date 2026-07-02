import { useState } from 'react';
import './HabitEdit.css';

export default function HabitEdit({ habit, onSave, onCancel }) {
    const [name, setName] = useState(habit.name);
    const [icon, setIcon] = useState(habit.icon || '💧');
    const [freq, setFreq] = useState(habit.freq ?? 'daily');
    const [type , setType] = useState(habit.type ?? 'count');
    const [amount, setAmount] = useState(habit.amount ?? 1);
    const [customUnit, setCustomUnit] = useState(habit.customUnit ?? '');
    const TYPE_UNITS = {
        count: 'rep(s)',
        time: 'minute(s)',
        volume: 'ml',
    };
    
    const handleSave = () => {
        onSave({ ...habit, name, icon, freq, type, amount: Number(amount), customUnit });
    };

    return (
        <div className="habit-edit">
            <h3 className="habit-edit-title">Edit Habit</h3>
            <div className="habit-edit-label">
                What's the habit?
                <div className="habit-edit-name-row">
                    <select
                        className="habit-edit-icon-select"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                    >
                        <option value="💧">💧</option>
                        <option value="📖">📖</option>
                        <option value="🏃‍♂️">🏃‍♂️</option>
                        <option value="🧘‍♀️">🧘‍♀️</option>
                        <option value="🍎">🍎</option>
                    </select>
                    <input
                        className="habit-edit-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Habit Name"
                    />
                </div>
            </div>
            <label className="habit-edit-label">
                What are you measuring?
                <div className="habit-edit-input-group">
                    <input
                    type="radio"
                    id="type-count"
                    name="habitType"
                    value="count"
                    className="win98-radio-input"
                    checked={type === "count"}
                    onChange={(e) => setType(e.target.value)}
                    />
                    <label htmlFor="type-count" className="win98-radio-block">
                        Count
                    </label>

                    <input
                    type="radio"
                    id="type-time"
                    name="habitType"
                    value="time"
                    className="win98-radio-input"
                    checked={type === "time"}
                    onChange={(e) => setType(e.target.value)}
                    />
                    <label htmlFor="type-time" className="win98-radio-block">
                        Time
                    </label>
                    <input
                    type="radio"
                    id="type-volume"
                    name="habitType"
                    value="volume"
                    className="win98-radio-input"
                    checked={type === "volume"}
                    onChange={(e) => setType(e.target.value)}
                    />
                    <label htmlFor="type-volume" className="win98-radio-block">
                        Volume
                    </label>
                    <input
                    type="radio"
                    id="type-completion"
                    name="habitType"
                    value="completion"
                    className="win98-radio-input"
                    checked={type === "completion"}
                    onChange={(e) => setType(e.target.value)}
                    />
                    <label htmlFor="type-completion" className="win98-radio-block">
                        Completion
                    </label>
                    <input
                    type="radio"
                    id="type-custom"
                    name="habitType"
                    value="custom"
                    className="win98-radio-input"
                    checked={type === "custom"}
                    onChange={(e) => setType(e.target.value)}
                    />
                    <label htmlFor="type-custom" className="win98-radio-block">
                        Custom
                    </label>
                    {type === "custom" && (
                        <input
                            type="text"
                            className="habit-edit-input habit-edit-custom-input"
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            placeholder="Units"
                        />
                    )}
                </div>
            </label>
            {type !== "completion" && (
                <div className="habit-edit-label">
                    <span>What amount?</span>
                    <div className="habit-edit-input habit-edit-amount-input">
                        <button className="habit-edit-minus-amount-button" onClick={() => amount > 1 ? setAmount(amount - 1) : setAmount(1)}>-</button>
                        <input
                            type="number"
                            value={amount}
                            min={1}
                            step={1}
                            onChange={(e) => e.target.value >= 1 ? setAmount(Number(e.target.value)) : setAmount(1)}
                            />
                    <span className="habit-edit-unit">
                        {type === "custom" ? customUnit || "units" : TYPE_UNITS[type]}
                    </span>
                    <button className="habit-edit-plus-amount-button" onClick={() => setAmount(amount + 1)}>+</button>
                </div>
            </div>)}
            <label className="habit-edit-label">
                Frequency
                <select
                    className="habit-edit-input"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                </select>
            </label>
            
            <div className="habit-edit-actions">
                <button className="habit-edit-cancel" onClick={onCancel}>Cancel</button>
                <button className="habit-edit-save" onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}