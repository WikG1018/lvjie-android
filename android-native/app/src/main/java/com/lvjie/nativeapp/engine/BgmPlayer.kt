package com.lvjie.nativeapp.engine

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import com.lvjie.nativeapp.R

/**
 * 背景音乐：内置 assets/bgm_ambient.wav 循环播放。
 * 开关跟随设置（PlayerState.bgm）。
 */
class BgmPlayer(private val context: Context) {
    private var player: MediaPlayer? = null
    private var enabled = true

    @Synchronized
    fun play() {
        enabled = true
        if (player != null) {
            if (player?.isPlaying == false) runCatching { player?.start() }
            return
        }
        runCatching {
            val afd = context.assets.openFd("bgm_ambient.wav")
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                afd.close()
                isLooping = true
                setVolume(0.28f, 0.28f)
                prepare()
                start()
            }
        }.onFailure {
            player = null
        }
    }

    @Synchronized
    fun pause() {
        runCatching { player?.pause() }
    }

    @Synchronized
    fun stop() {
        runCatching {
            player?.stop()
            player?.release()
        }
        player = null
    }

    @Synchronized
    fun setEnabled(on: Boolean) {
        if (on) play() else pause()
    }

    val isPlaying: Boolean
        get() = player?.isPlaying == true
}
