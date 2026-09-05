import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, X, Delete, Copy, Check, Percent } from 'lucide-react';

interface AuditCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditCalculatorModal: React.FC<AuditCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clear all
  const clearAll = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setPrevVal(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  // Backspace
  const backspace = useCallback(() => {
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay((prev) => prev.slice(0, -1));
    }
  }, [display, waitingForOperand]);

  // Input digit
  const inputDigit = useCallback(
    (digit: string) => {
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay((prev) => (prev === '0' ? digit : prev.length < 15 ? prev + digit : prev));
      }
    },
    [waitingForOperand]
  );

  // Input dot
  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  }, [display, waitingForOperand]);

  // Toggle sign
  const toggleSign = useCallback(() => {
    const val = parseFloat(display);
    if (val !== 0) {
      setDisplay(String(-val));
    }
  }, [display]);

  // Calculate
  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '×':
      case '*':
        return first * second;
      case '÷':
      case '/':
        return second === 0 ? 0 : first / second;
      default:
        return second;
    }
  };

  // Perform operation
  const performOperation = useCallback(
    (nextOperator: string) => {
      const inputValue = parseFloat(display);

      if (prevVal === null) {
        setPrevVal(inputValue);
        setEquation(`${inputValue} ${nextOperator}`);
      } else if (operator) {
        const currentValue = prevVal;
        const result = calculate(currentValue, inputValue, operator);
        const rounded = Math.round(result * 10000) / 10000;
        setPrevVal(rounded);
        setDisplay(String(rounded));
        setEquation(`${rounded} ${nextOperator}`);
      }

      setWaitingForOperand(true);
      setOperator(nextOperator);
    },
    [display, prevVal, operator]
  );

  // Handle equals
  const handleEquals = useCallback(() => {
    if (prevVal === null || !operator) return;

    const inputValue = parseFloat(display);
    const result = calculate(prevVal, inputValue, operator);
    const rounded = Math.round(result * 10000) / 10000;

    setEquation(`${prevVal} ${operator} ${inputValue} =`);
    setDisplay(String(rounded));
    setPrevVal(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [prevVal, operator, display]);

  // Quick percent (or MDR 2% / GST 18% calculation)
  const handlePercentage = useCallback(() => {
    const currentValue = parseFloat(display);
    if (currentValue === 0) return;
    const fixed = Math.round((currentValue / 100) * 10000) / 10000;
    setDisplay(String(fixed));
  }, [display]);

  // Quick 2.36% Razorpay Net Deduction helper
  const applyRazorpayNetRate = useCallback(() => {
    const gross = parseFloat(display);
    if (gross <= 0 || isNaN(gross)) return;
    // 2.36% total deduction = Gross * 0.0236
    const deduction = Math.round(gross * 0.0236 * 100) / 100;
    const net = Math.round((gross - deduction) * 100) / 100;
    setEquation(`₹${gross} - 2.36% (MDR+GST) =`);
    setDisplay(String(net));
    setWaitingForOperand(true);
  }, [display]);

  // Copy result
  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        inputDot();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        performOperation(e.key);
      } else if (e.key === '*') {
        e.preventDefault();
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, inputDigit, inputDot, performOperation, handleEquals, backspace, clearAll]);

  if (!isOpen) return null;

  return (
    <div
      id="calculator-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-150"
    >
      <div
        id="calculator-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-tight text-white">Recon Calculator</h3>
              <p className="text-[10px] text-slate-400 font-mono">Financial Arithmetic</p>
            </div>
          </div>
          <button
            id="close-calculator-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display screen */}
        <div className="px-4 py-3 bg-slate-950 flex flex-col items-end justify-center min-h-[85px] border-b border-slate-800/80">
          <div className="text-[11px] font-mono text-indigo-400/90 h-4 overflow-hidden truncate max-w-full">
            {equation || ' '}
          </div>
          <div className="flex items-center justify-between w-full mt-1">
            <button
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-300 text-[10px] flex items-center gap-1 font-mono transition"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none">
              {display}
            </div>
          </div>
        </div>

        {/* Quick Razorpay Preset Action */}
        <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">Quick Deduct:</span>
          <button
            id="btn-quick-deduct-236"
            onClick={applyRazorpayNetRate}
            className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/60 transition font-semibold"
            title="Deduct 2.36% (2% MDR + 18% GST) from current gross"
          >
            -2.36% (Net Settlement)
          </button>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900">
          {/* Row 1 */}
          <button
            id="calc-clear-btn"
            onClick={clearAll}
            className="h-10 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 font-bold text-xs hover:bg-rose-900/50 active:scale-95 transition flex items-center justify-center"
          >
            C
          </button>
          <button
            id="calc-backspace-btn"
            onClick={backspace}
            className="h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="h-4 w-4" />
          </button>
          <button
            id="calc-percent-btn"
            onClick={handlePercentage}
            className="h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-700 active:scale-95 transition flex items-center justify-center"
          >
            %
          </button>
          <button
            id="calc-op-divide"
            onClick={() => performOperation('÷')}
            className={`h-10 rounded-xl font-bold text-sm active:scale-95 transition flex items-center justify-center ${
              operator === '÷'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80'
            }`}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => inputDigit('7')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            7
          </button>
          <button
            onClick={() => inputDigit('8')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            8
          </button>
          <button
            onClick={() => inputDigit('9')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            9
          </button>
          <button
            id="calc-op-multiply"
            onClick={() => performOperation('×')}
            className={`h-10 rounded-xl font-bold text-sm active:scale-95 transition flex items-center justify-center ${
              operator === '×'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80'
            }`}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => inputDigit('4')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            4
          </button>
          <button
            onClick={() => inputDigit('5')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            5
          </button>
          <button
            onClick={() => inputDigit('6')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            6
          </button>
          <button
            id="calc-op-subtract"
            onClick={() => performOperation('-')}
            className={`h-10 rounded-xl font-bold text-sm active:scale-95 transition flex items-center justify-center ${
              operator === '-'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80'
            }`}
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => inputDigit('1')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            1
          </button>
          <button
            onClick={() => inputDigit('2')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            2
          </button>
          <button
            onClick={() => inputDigit('3')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            3
          </button>
          <button
            id="calc-op-add"
            onClick={() => performOperation('+')}
            className={`h-10 rounded-xl font-bold text-sm active:scale-95 transition flex items-center justify-center ${
              operator === '+'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80'
            }`}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={toggleSign}
            className="h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-700 active:scale-95 transition"
          >
            ±
          </button>
          <button
            onClick={() => inputDigit('0')}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-semibold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={inputDot}
            className="h-10 rounded-xl bg-slate-800/80 border border-slate-750 text-white font-mono font-bold text-sm hover:bg-slate-700 active:scale-95 transition"
          >
            .
          </button>
          <button
            id="calc-op-equals"
            onClick={handleEquals}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-sm active:scale-95 transition flex items-center justify-center"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
