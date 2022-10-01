<template>
  <h1 v-if="this.ffmpeg == 'false' || this.whisper == 'false'">
    Missing Dependencies
  </h1>
  <div v-if="this.ffmpeg == 'false' || this.whisper == 'false'" class="element">
    <div v-if="this.whisper == 'false'">
      <button @click="this.openUrl('https://github.com/openai/whisper#setup')">
        Install
      </button>
      <p>Whisper is not installed</p>
    </div>
    <div v-if="this.ffmpeg == 'false'">
      <button @click="this.openUrl('https://ffmpeg.org/download.html')">
        Install
      </button>
      <p>ffmpeg is not installed</p>
    </div>
  </div>
  <h2 v-else>No missing dependencies</h2>
</template>

<script>
// @ is an alias to /src
const axios = require("axios");
export default {
  name: "SetupView",
  components: {},
  data() {
    return {
      ffmpeg: sessionStorage.getItem("ffmpeg"),
      whisper: sessionStorage.getItem("whisper"),
    };
  },
  methods: {
    openUrl(url) {
      axios({
        method: "post",
        url: "http://localhost:9861/api/openUrl",
        data: {
          url: url,
        },
      });
    },
  },
};
</script>

<style scoped>
button {
  background-color: #42b983;
  padding: 10px 18px;
  border-radius: 3px;
  border: none;
  cursor: pointer;

  font-size: 17px;
}

button:hover {
  background-color: #70cca2;
}

button:active {
  background-color: #42b983;
}

.element {
  background-color: #1d2935;

  width: 450px;

  padding: 20px;
  border-radius: 7px;
}

.element > div {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  align-content: stretch;

  margin: 30px;
}
</style>
