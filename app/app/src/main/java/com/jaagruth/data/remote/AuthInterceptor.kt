package com.jaagruth.data.remote

import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = TokenStore.getToken()

        val requestBuilder = original.newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.header("Authorization", "Bearer $token")
        }
        requestBuilder.header("Accept", "application/json")

        val response = chain.proceed(requestBuilder.build())

        if (response.code == 401) {
            // Token expired or invalid
            TokenStore.clear()
        }

        return response
    }
}
