package com.jaagruth.data.remote

import android.content.Context
import com.google.gson.GsonBuilder
import com.jaagruth.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkClient {
    private var apiServiceInstance: ApiService? = null
    private var okHttpClientInstance: OkHttpClient? = null

    fun getOkHttpClient(): OkHttpClient {
        if (okHttpClientInstance == null) {
            val builder = OkHttpClient.Builder()
                .connectTimeout(8, TimeUnit.SECONDS)
                .readTimeout(8, TimeUnit.SECONDS)
                .writeTimeout(8, TimeUnit.SECONDS)
                .addInterceptor(AuthInterceptor())

            if (BuildConfig.DEBUG) {
                val logging = HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }
                builder.addInterceptor(logging)
            }

            okHttpClientInstance = builder.build()
        }
        return okHttpClientInstance!!
    }

    fun getApiService(context: Context): ApiService {
        TokenStore.init(context)

        if (apiServiceInstance == null) {
            val gson = GsonBuilder().setLenient().create()
            val retrofit = Retrofit.Builder()
                .baseUrl(BuildConfig.BASE_URL)
                .client(getOkHttpClient())
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()

            apiServiceInstance = retrofit.create(ApiService::class.java)
        }
        return apiServiceInstance!!
    }
}
