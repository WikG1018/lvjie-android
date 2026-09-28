package com.lvjie.nativeapp.engine

import com.lvjie.nativeapp.data.PlayerState

/**
 * 货币四档 main/mid/high/peak，相邻 100:1，默认不自动进位。
 * 扣款：高抵低并找零（对齐上游 util.js spendMoney）。
 */
object Money {
    const val STEP = 100

    data class Wallet(var main: Int = 0, var mid: Int = 0, var high: Int = 0, var peak: Int = 0)

    fun of(s: PlayerState) = Wallet(s.money, s.moneyMid, s.moneyHigh, s.moneyPeak)

    fun totalInMain(w: Wallet): Long =
        w.main.toLong() + w.mid.toLong() * STEP +
            w.high.toLong() * STEP * STEP +
            w.peak.toLong() * STEP * STEP * STEP

    /** 扣 cost（最低档计）。钱不够返回 null；找零写回最低档。 */
    fun spend(w: Wallet, cost: Int): Wallet? {
        if (cost < 0) return null
        val have = totalInMain(w)
        if (have < cost) return null
        var remain = have - cost
        val n = Wallet()
        n.peak = (remain / (1L * STEP * STEP * STEP)).toInt()
        remain -= n.peak.toLong() * STEP * STEP * STEP
        n.high = (remain / (STEP * STEP)).toInt()
        remain -= n.high.toLong() * STEP * STEP
        n.mid = (remain / STEP).toInt()
        remain -= n.mid.toLong() * STEP
        n.main = remain.toInt()
        return n
    }

    /** 收入按档累加，不进位 */
    fun earn(w: Wallet, main: Int = 0, mid: Int = 0, high: Int = 0, peak: Int = 0): Wallet =
        Wallet(w.main + main, w.mid + mid, w.high + high, w.peak + peak)

    fun apply(s: PlayerState, w: Wallet): PlayerState =
        s.copy(money = w.main, moneyMid = w.mid, moneyHigh = w.high, moneyPeak = w.peak)
}
