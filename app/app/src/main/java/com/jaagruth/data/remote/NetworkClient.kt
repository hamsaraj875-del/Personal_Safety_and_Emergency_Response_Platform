package com.jaagruth.data.remote

import android.content.Context
import com.google.gson.*
import com.jaagruth.BuildConfig
import com.jaagruth.model.LatLng
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.lang.reflect.Type
import java.util.concurrent.TimeUnit

class LatLngDeserializer : JsonDeserializer<LatLng> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): LatLng {
        if (json == null || json.isJsonNull) {
            return LatLng(12.9352, 77.5358)
        }
        return try {
            if (json.isJsonObject) {
                val obj = json.asJsonObject
                if (obj.has("lat") && obj.has("lng") && !obj.get("lat").isJsonNull && !obj.get("lng").isJsonNull) {
                    val lat = obj.get("lat").asDouble
                    val lng = obj.get("lng").asDouble
                    if (lat != 0.0 || lng != 0.0) {
                        return LatLng(lat, lng)
                    }
                }
                if (obj.has("coordinates") && obj.get("coordinates").isJsonArray) {
                    val coords = obj.getAsJsonArray("coordinates")
                    if (coords.size() >= 2) {
                        val lng = coords[0].asDouble
                        val lat = coords[1].asDouble
                        if (lat != 0.0 || lng != 0.0) {
                            return LatLng(lat, lng)
                        }
                    }
                }
            } else if (json.isJsonArray) {
                val arr = json.asJsonArray
                if (arr.size() >= 2) {
                    val lng = arr[0].asDouble
                    val lat = arr[1].asDouble
                    if (lat != 0.0 || lng != 0.0) {
                        return LatLng(lat, lng)
                    }
                }
            }
            LatLng(12.9352, 77.5358)
        } catch (e: Exception) {
            LatLng(12.9352, 77.5358)
        }
    }
}

object NetworkClient {
    private var apiServiceInstance: ApiService? = null
    private var okHttpClientInstance: OkHttpClient? = null

    val gson: Gson by lazy {
        GsonBuilder()
            .registerTypeAdapter(LatLng::class.java, LatLngDeserializer())
            .setLenient()
            .create()
    }

    fun getOkHttpClient(): OkHttpClient {
        if (okHttpClientInstance == null) {
            val builder = OkHttpClient.Builder()
                .connectTimeout(6, TimeUnit.SECONDS)
                .readTimeout(6, TimeUnit.SECONDS)
                .writeTimeout(6, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
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
