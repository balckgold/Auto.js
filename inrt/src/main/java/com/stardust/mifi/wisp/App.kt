package com.stardust.mifi.wisp

import android.app.Application
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.net.Uri
import android.view.View
import android.widget.ImageView
import cn.leancloud.AVLogger
import cn.leancloud.AVOSCloud
import cn.leancloud.AVUser

import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition
import com.stardust.app.GlobalAppContext
import com.stardust.mifi.wisp.bjb.AutoJs
import com.stardust.mifi.wisp.bjb.GlobalKeyObserver
import com.stardust.autojs.core.ui.inflater.ImageLoader
import com.stardust.autojs.core.ui.inflater.util.Drawables

/**
 * Created by Stardust on 2017/7/1.
 */

class App : Application() {

    override fun onCreate() {
        super.onCreate()
        GlobalAppContext.set(this)
        AutoJs.initInstance(this)
        GlobalKeyObserver.init()
        //wisp add
//        AVOSCloud.setLogLevel(AVLogger.Level.DEBUG);// or AVOSCloud.setLogLevel(AVLogger.Level.VERBOSE);
        AVOSCloud.initialize(this,"sWNimdQk9KzqGOym07XL6YJx-gzGzoHsz","BbplFbAAKGJmWQtpwTeF2BXh");
        //wisp add end
        Drawables.setDefaultImageLoader(object : ImageLoader {
            override fun loadInto(imageView: ImageView, uri: Uri) {
                Glide.with(this@App)
                        .load(uri)
                        .into(imageView)
            }

            override fun loadIntoBackground(view: View, uri: Uri) {
                Glide.with(this@App)
                        .load(uri)
                        .into(object : SimpleTarget<Drawable>() {
                            override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>) {
                                view.background = resource
                            }
                        })
            }

            override fun load(view: View, uri: Uri): Drawable {
                throw UnsupportedOperationException()
            }

            override fun load(view: View, uri: Uri, drawableCallback: ImageLoader.DrawableCallback) {
                Glide.with(this@App)
                        .load(uri)
                        .into(object : SimpleTarget<Drawable>() {
                            override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>) {
                                drawableCallback.onLoaded(resource)
                            }
                        })
            }

            override fun load(view: View, uri: Uri, bitmapCallback: ImageLoader.BitmapCallback) {
                Glide.with(this@App)
                        .asBitmap()
                        .load(uri)
                        .into(object : SimpleTarget<Bitmap>() {
                            override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>) {
                                bitmapCallback.onLoaded(resource)
                            }
                        })
            }
        })
    }

}