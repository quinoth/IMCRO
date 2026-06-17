/**
 * useHotkeys — хук для регистрации горячих клавиш.
 *
 * Принимает объект keyMap: { "ctrl+z": handler, "delete": handler, ... }
 * Поддерживает модификаторы: ctrl, shift, alt, meta.
 * Автоматически отключается когда фокус в input/textarea/select.
 *
 * @param {Object.<string, function>} keyMap - карта горячих клавиш
 * @param {boolean} enabled - включены ли горячие клавиши (по умолчанию true)
 */
import { useEffect, useCallback, useRef } from "react";

/** Нормализует строку комбинации клавиш в канонический вид */
function normalizeCombo(combo) {
  return combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .sort()
    .join("+");
}

/** Получает канонический вид нажатой комбинации из KeyboardEvent */
function eventToCombo(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");

  let key = e.key.toLowerCase();
  // Нормализация спецклавиш
  if (key === "backspace") key = "backspace";
  else if (key === "escape") key = "escape";
  else if (key === " ") key = "space";

  // Не добавляем модификаторы как самостоятельные клавиши
  if (!["control", "shift", "alt", "meta"].includes(key)) {
    parts.push(key);
  }

  return parts.sort().join("+");
}

export default function useHotkeys(keyMap, enabled = true) {
  const keyMapRef = useRef(keyMap);

  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handler = useCallback(
    (e) => {
      if (!enabled) return;

      // Не перехватывать когда фокус в текстовом поле
      const tag = (e.target?.tagName || "").toLowerCase();
      const isEditable = e.target?.isContentEditable;
      if (["input", "textarea", "select"].includes(tag) || isEditable) {
        // Исключение: Ctrl+S и Escape всегда работают
        const combo = eventToCombo(e);
        const isGlobalCombo = combo === "ctrl+s" || combo === "escape";
        if (!isGlobalCombo) return;
      }

      const combo = eventToCombo(e);
      const map = keyMapRef.current;

      // Ищем обработчик по нормализованной комбинации
      for (const [registeredCombo, fn] of Object.entries(map)) {
        if (normalizeCombo(registeredCombo) === combo && typeof fn === "function") {
          e.preventDefault();
          e.stopPropagation();
          fn(e);
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [handler, enabled]);
}
