/** 电脑思考间隔：每步 0.8–1.5 秒，避免连着闪多步。 */
export const BOT_DELAY_MIN = 800
export const BOT_DELAY_MAX = 1500

export function botThinkMs() {
  return BOT_DELAY_MIN + Math.floor(Math.random() * (BOT_DELAY_MAX - BOT_DELAY_MIN + 1))
}
