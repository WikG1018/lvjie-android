package com.lvjie.nativeapp.engine

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer

/**
 * 背景音乐：assets/bgm_ambient.wav 循环播放。
 * prepareAsync 避免主线程阻塞；异常时释放资源。
 */
class BgmPlayer(private val context: Context) {
    private var player: MediaPlayer? = null

    @Synchronized
    fun play() {
        if (player != null) {
            runCatching { if (player?.isPlaying == false) player?.start() }
            return
        }
        var afd: android.content.res.AssetFileDescriptor? = null
        try {
            afd = context.assets.openFd("bgm_ambient.wav")
            val p = MediaPlayer()
            player = p
            p.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            p.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
            afd.close()
            afd = null
            p.isLooping = true
            p.setVolume(0.28f, 0.28f)
            p.setOnPreparedListener { mp -> runCatching { mp.start() } }
            p.setOnErrorListener { _, _, _ ->
                releaseInternal()
                true
            }
            p.prepareAsync()
        } catch (e: Throwable) {
            runCatching { afd?.close() }
            releaseInternal()
        }
    }

    @Synchronized
    fun pause() {
        runCatching { player?.pause() }
    }

    @Synchronized
    fun stop() {
        releaseInternal()
    }

    @Synchronized
    fun setEnabled(on: Boolean) {
        if (on) play() else pause()
    }

    private fun releaseInternal() {
        try {
            player?.release()
        } catch (_: Throwable) {
        }
        player = null
    }

    val isPlaying: Boolean
        get() = player?.isPlaying == true
}
