//
//  ContentView.swift
//  Moleculahana
//
//  Created by Ongar.dev on 23/02/2023.
//

import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        VStack {
            WebView(urlString: "https://biochem.kz/moleculahana/index.html")
        }
        .padding()
    }
}

struct WebView: NSViewRepresentable {
    var urlString: String
    
    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.load(URLRequest(url: URL(string: urlString)!))
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        nsView.load(URLRequest(url: URL(string: urlString)!))
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
