// // popup.js

// document.addEventListener("DOMContentLoaded", async () => {
//   const outputDiv = document.getElementById("output");
//   const API_KEY = "AIzaSyBfwbyKRp_uPQMeZFDm3RcZ5bGU2o80QsU"; // Replace with your actual YouTube Data API key
//   // const API_URL = 'http://my-elb-2062136355.us-east-1.elb.amazonaws.com:80';
//   const API_URL = "http://localhost:5000/";

//   // Get the current tab's URL
//   chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//     const url = tabs[0].url;
//     const youtubeRegex =
//       /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/;
//     const match = url.match(youtubeRegex);

//     if (match && match[1]) {
//       const videoId = match[1];
//       outputDiv.innerHTML = `<div class="section-title">YouTube Video ID</div><p>${videoId}</p><p>Fetching comments...</p>`;

//       const comments = await fetchComments(videoId);
//       if (comments.length === 0) {
//         outputDiv.innerHTML += "<p>No comments found for this video.</p>";
//         return;
//       }

//       outputDiv.innerHTML += `<p>Fetched ${comments.length} comments. Performing sentiment analysis...</p>`;
//       const predictions = await getSentimentPredictions(comments);

//       if (predictions) {
//         // Process the predictions to get sentiment counts and sentiment data
//         const sentimentCounts = { 1: 0, 0: 0, "-1": 0 };
//         const sentimentData = []; // For trend graph
//         const totalSentimentScore = predictions.reduce(
//           (sum, item) => sum + parseInt(item.sentiment),
//           0
//         );
//         predictions.forEach((item, index) => {
//           sentimentCounts[item.sentiment]++;
//           sentimentData.push({
//             timestamp: item.timestamp,
//             sentiment: parseInt(item.sentiment),
//           });
//         });

//         // Compute metrics
//         const totalComments = comments.length;
//         const uniqueCommenters = new Set(
//           comments.map((comment) => comment.authorId)
//         ).size;
//         const totalWords = comments.reduce(
//           (sum, comment) =>
//             sum +
//             comment.text.split(/\s+/).filter((word) => word.length > 0).length,
//           0
//         );
//         const avgWordLength = (totalWords / totalComments).toFixed(2);
//         const avgSentimentScore = (totalSentimentScore / totalComments).toFixed(
//           2
//         );

//         // Normalize the average sentiment score to a scale of 0 to 10
//         const normalizedSentimentScore = (
//           ((parseFloat(avgSentimentScore) + 1) / 2) *
//           10
//         ).toFixed(2);

//         // Add the Comment Analysis Summary section
//         outputDiv.innerHTML += `
//           <div class="section">
//             <div class="section-title">Comment Analysis Summary</div>
//             <div class="metrics-container">
//               <div class="metric">
//                 <div class="metric-title">Total Comments</div>
//                 <div class="metric-value">${totalComments}</div>
//               </div>
//               <div class="metric">
//                 <div class="metric-title">Unique Commenters</div>
//                 <div class="metric-value">${uniqueCommenters}</div>
//               </div>
//               <div class="metric">
//                 <div class="metric-title">Avg Comment Length</div>
//                 <div class="metric-value">${avgWordLength} words</div>
//               </div>
//               <div class="metric">
//                 <div class="metric-title">Avg Sentiment Score</div>
//                 <div class="metric-value">${normalizedSentimentScore}/10</div>
//               </div>
//             </div>
//           </div>
//         `;

//         // Add the Sentiment Analysis Results section with a placeholder for the chart
//         outputDiv.innerHTML += `
//           <div class="section">
//             <div class="section-title">Sentiment Analysis Results</div>
//             <p>See the pie chart below for sentiment distribution.</p>
//             <div id="chart-container"></div>
//           </div>`;

//         // Fetch and display the pie chart inside the chart-container div
//         await fetchAndDisplayChart(sentimentCounts);

//         // Add the Sentiment Trend Graph section
//         outputDiv.innerHTML += `
//           <div class="section">
//             <div class="section-title">Sentiment Trend Over Time</div>
//             <div id="trend-graph-container"></div>
//           </div>`;

//         // Fetch and display the sentiment trend graph
//         await fetchAndDisplayTrendGraph(sentimentData);

//         // Add the Word Cloud section
//         outputDiv.innerHTML += `
//           <div class="section">
//             <div class="section-title">Comment Wordcloud</div>
//             <div id="wordcloud-container"></div>
//           </div>`;

//         // Fetch and display the word cloud inside the wordcloud-container div
//         await fetchAndDisplayWordCloud(comments.map((comment) => comment.text));

//         // Add the top comments section
//         outputDiv.innerHTML += `
//           <div class="section">
//             <div class="section-title">Top 25 Comments with Sentiments</div>
//             <ul class="comment-list">
//               ${predictions
//                 .slice(0, 25)
//                 .map(
//                   (item, index) => `
//                 <li class="comment-item">
//                   <span>${index + 1}. ${item.comment}</span><br>
//                   <span class="comment-sentiment">Sentiment: ${
//                     item.sentiment
//                   }</span>
//                 </li>`
//                 )
//                 .join("")}
//             </ul>
//           </div>`;
//       }
//     } else {
//       outputDiv.innerHTML = "<p>This is not a valid YouTube URL.</p>";
//     }
//   });

//   async function fetchComments(videoId) {
//     let comments = [];
//     let pageToken = "";
//     try {
//       while (comments.length < 500) {
//         const response = await fetch(
//           `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&pageToken=${pageToken}&key=${API_KEY}`
//         );
//         const data = await response.json();
//         if (data.items) {
//           data.items.forEach((item) => {
//             const commentText =
//               item.snippet.topLevelComment.snippet.textOriginal;
//             const timestamp = item.snippet.topLevelComment.snippet.publishedAt;
//             const authorId =
//               item.snippet.topLevelComment.snippet.authorChannelId?.value ||
//               "Unknown";
//             comments.push({
//               text: commentText,
//               timestamp: timestamp,
//               authorId: authorId,
//             });
//           });
//         }
//         pageToken = data.nextPageToken;
//         if (!pageToken) break;
//       }
//     } catch (error) {
//       console.error("Error fetching comments:", error);
//       outputDiv.innerHTML += "<p>Error fetching comments.</p>";
//     }
//     return comments;
//   }

//   async function getSentimentPredictions(comments) {
//     try {
//       const response = await fetch(`${API_URL}/predict_with_timestamps`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ comments }),
//       });
//       const result = await response.json();
//       if (response.ok) {
//         return result; // The result now includes sentiment and timestamp
//       } else {
//         throw new Error(result.error || "Error fetching predictions");
//       }
//     } catch (error) {
//       console.error("Error fetching predictions:", error);
//       outputDiv.innerHTML += "<p>Error fetching sentiment predictions.</p>";
//       return null;
//     }
//   }

//   async function fetchAndDisplayChart(sentimentCounts) {
//     try {
//       const response = await fetch(`${API_URL}/generate_chart`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sentiment_counts: sentimentCounts }),
//       });
//       if (!response.ok) {
//         throw new Error("Failed to fetch chart image");
//       }
//       const blob = await response.blob();
//       const imgURL = URL.createObjectURL(blob);
//       const img = document.createElement("img");
//       img.src = imgURL;
//       img.style.width = "100%";
//       img.style.marginTop = "20px";
//       // Append the image to the chart-container div
//       const chartContainer = document.getElementById("chart-container");
//       chartContainer.appendChild(img);
//     } catch (error) {
//       console.error("Error fetching chart image:", error);
//       outputDiv.innerHTML += "<p>Error fetching chart image.</p>";
//     }
//   }

//   async function fetchAndDisplayWordCloud(comments) {
//     try {
//       const response = await fetch(`${API_URL}/generate_wordcloud`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ comments }),
//       });
//       if (!response.ok) {
//         throw new Error("Failed to fetch word cloud image");
//       }
//       const blob = await response.blob();
//       const imgURL = URL.createObjectURL(blob);
//       const img = document.createElement("img");
//       img.src = imgURL;
//       img.style.width = "100%";
//       img.style.marginTop = "20px";
//       // Append the image to the wordcloud-container div
//       const wordcloudContainer = document.getElementById("wordcloud-container");
//       wordcloudContainer.appendChild(img);
//     } catch (error) {
//       console.error("Error fetching word cloud image:", error);
//       outputDiv.innerHTML += "<p>Error fetching word cloud image.</p>";
//     }
//   }

//   async function fetchAndDisplayTrendGraph(sentimentData) {
//     try {
//       const response = await fetch(`${API_URL}/generate_trend_graph`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sentiment_data: sentimentData }),
//       });
//       if (!response.ok) {
//         throw new Error("Failed to fetch trend graph image");
//       }
//       const blob = await response.blob();
//       const imgURL = URL.createObjectURL(blob);
//       const img = document.createElement("img");
//       img.src = imgURL;
//       img.style.width = "100%";
//       img.style.marginTop = "20px";
//       // Append the image to the trend-graph-container div
//       const trendGraphContainer = document.getElementById(
//         "trend-graph-container"
//       );
//       trendGraphContainer.appendChild(img);
//     } catch (error) {
//       console.error("Error fetching trend graph image:", error);
//       outputDiv.innerHTML += "<p>Error fetching trend graph image.</p>";
//     }
//   }
// });

// popup.js

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const API_KEY = "AIzaSyBfwbyKRp_uPQMeZFDm3RcZ5bGU2o80QsU"; // ⚠️ Replace with your key. WARNING: Not secure for production.
  const API_URL = "http://localhost:5000"; // Your backend server URL
  const MAX_COMMENTS_TO_FETCH = 500;
  const TOP_COMMENTS_TO_DISPLAY = 25;

  // --- DOM ELEMENTS ---
  const loader = document.getElementById("loader");
  const loadingStatus = document.getElementById("loading-status");
  const resultsDiv = document.getElementById("results");
  const errorDiv = document.getElementById("error-message");
  const metricsContainer = document.getElementById("metrics-container");
  const chartContainer = document.getElementById("chart-container");
  const trendGraphContainer = document.getElementById("trend-graph-container");
  const wordCloudContainer = document.getElementById("wordcloud-container");
  const commentList = document.getElementById("comment-list");

  // --- UI HELPER FUNCTIONS ---
  const ui = {
    showLoading: (message) => {
      loadingStatus.textContent = message;
      loader.style.display = "flex";
      resultsDiv.style.display = "none";
      errorDiv.style.display = "none";
    },
    showResults: () => {
      loader.style.display = "none";
      resultsDiv.style.display = "block";
      errorDiv.style.display = "none";
    },
    showError: (message) => {
      errorDiv.textContent = message;
      loader.style.display = "none";
      resultsDiv.style.display = "none";
      errorDiv.style.display = "block";
    },
  };

  // --- DATA RENDERING FUNCTIONS ---
  const render = {
    summaryMetrics: (comments, predictions) => {
      const totalComments = comments.length;
      const uniqueCommenters = new Set(comments.map((c) => c.authorId)).size;
      const totalWords = comments.reduce(
        (sum, c) => sum + c.text.split(/\s+/).filter(Boolean).length,
        0
      );
      const avgWordLength =
        totalComments > 0 ? (totalWords / totalComments).toFixed(1) : 0;

      const totalSentimentScore = predictions.reduce(
        (sum, p) => sum + parseInt(p.sentiment, 10),
        0
      );
      const avgSentimentScore =
        totalComments > 0 ? totalSentimentScore / totalComments : 0;
      // Normalize from [-1, 1] to [0, 10]
      const normalizedSentimentScore = (
        ((avgSentimentScore + 1) / 2) *
        10
      ).toFixed(1);

      metricsContainer.innerHTML = `
        <div class="metric">
          <div class="metric-title">Total Comments</div>
          <div class="metric-value">${totalComments}</div>
        </div>
        <div class="metric">
          <div class="metric-title">Unique Commenters</div>
          <div class="metric-value">${uniqueCommenters}</div>
        </div>
        <div class="metric">
          <div class="metric-title">Avg Comment Length</div>
          <div class="metric-value">${avgWordLength} words</div>
        </div>
        <div class="metric">
          <div class="metric-title">Avg Sentiment Score</div>
          <div class="metric-value">${normalizedSentimentScore}/10</div>
        </div>`;
    },
    image: (container, blob) => {
      const imgURL = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = imgURL;
      img.className = "chart-image";
      container.innerHTML = ""; // Clear previous content
      container.appendChild(img);
    },
    topComments: (predictions) => {
      const sentimentMap = {
        1: { text: "Positive 👍", class: "sentiment-positive" },
        0: { text: "Neutral 😐", class: "sentiment-neutral" },
        "-1": { text: "Negative 👎", class: "sentiment-negative" },
      };

      commentList.innerHTML = predictions
        .slice(0, TOP_COMMENTS_TO_DISPLAY)
        .map((p) => {
          const sentiment = sentimentMap[p.sentiment] || {
            text: "Unknown",
            class: "",
          };
          return `
              <li class="comment-item">
                <span class="comment-text">${p.comment}</span>
                <span class="comment-sentiment">
                  <span class="${sentiment.class}">${sentiment.text}</span>
                </span>
              </li>`;
        })
        .join("");
    },
  };

  // --- API HELPER FUNCTIONS ---
  const api = {
    fetchComments: async (videoId) => {
      let comments = [];
      let pageToken = "";
      try {
        while (comments.length < MAX_COMMENTS_TO_FETCH) {
          const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&pageToken=${pageToken}&key=${API_KEY}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.error)
            throw new Error(`YouTube API Error: ${data.error.message}`);

          if (data.items) {
            comments.push(
              ...data.items.map((item) => ({
                text: item.snippet.topLevelComment.snippet.textOriginal,
                timestamp: item.snippet.topLevelComment.snippet.publishedAt,
                authorId:
                  item.snippet.topLevelComment.snippet.authorChannelId?.value ||
                  "Unknown",
              }))
            );
          }

          pageToken = data.nextPageToken;
          if (!pageToken) break;
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw new Error(
          "Could not fetch YouTube comments. Check the API key and video permissions."
        );
      }
      return comments;
    },
    getPredictions: async (comments) => {
      try {
        const response = await fetch(`${API_URL}/predict_with_timestamps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments }),
        });
        if (!response.ok)
          throw new Error("Failed to get sentiment predictions from server.");
        return await response.json();
      } catch (error) {
        console.error("Error fetching predictions:", error);
        throw new Error(
          "Could not analyze comments. Is the backend server running?"
        );
      }
    },
    generateImage: async (endpoint, payload) => {
      try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok)
          throw new Error(`Failed to generate image from ${endpoint}.`);
        return await response.blob();
      } catch (error) {
        console.error(`Error fetching image from ${endpoint}:`, error);
        throw new Error(
          `Could not generate the visual graph from ${endpoint}.`
        );
      }
    },
  };

  // --- MAIN EXECUTION LOGIC ---
  const main = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const url = tabs[0].url;
        const youtubeRegex =
          /^https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})/;
        const match = url.match(youtubeRegex);

        if (!match || !match[1]) {
          ui.showError("This is not a valid YouTube video page.");
          return;
        }

        const videoId = match[1];

        ui.showLoading("Fetching comments...");
        const comments = await api.fetchComments(videoId);

        if (comments.length === 0) {
          ui.showError("No comments found for this video.");
          return;
        }

        ui.showLoading(`Analyzing ${comments.length} comments...`);
        const predictions = await api.getPredictions(comments);

        // --- Prepare data for visualizations ---
        const sentimentCounts = predictions.reduce((acc, p) => {
          acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
          return acc;
        }, {});

        const sentimentData = predictions.map((p) => ({
          timestamp: p.timestamp,
          sentiment: parseInt(p.sentiment, 10),
        }));

        // --- Render static content first for faster perceived performance ---
        render.summaryMetrics(comments, predictions);
        render.topComments(predictions);
        ui.showResults(); // Show the main layout

        // --- Asynchronously fetch and render images ---
        ui.showLoading("Generating visualizations...");

        const chartBlob = await api.generateImage("generate_chart", {
          sentiment_counts: sentimentCounts,
        });
        render.image(chartContainer, chartBlob);

        const trendBlob = await api.generateImage("generate_trend_graph", {
          sentiment_data: sentimentData,
        });
        render.image(trendGraphContainer, trendBlob);

        const wordCloudBlob = await api.generateImage("generate_wordcloud", {
          comments: comments.map((c) => c.text),
        });
        render.image(wordCloudContainer, wordCloudBlob);

        ui.showResults(); // Ensure results are shown after all images are loaded
      } catch (error) {
        console.error("Main execution failed:", error);
        ui.showError(error.message);
      }
    });
  };

  main();
});
