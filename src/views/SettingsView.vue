<template>
  <div class="settings">
    <div class="setting">
      <h3>Working Directory</h3>
      <button @click="this.selectDir()">Select Directory</button>
      <input v-model="this.workingDir" type="text" />
    </div>
    <div class="setting">
      <h3>Whisper Options</h3>
      <button
        @click="
          this.openUrl('https://github.com/openai/whisper#command-line-usage')
        "
      >
        Read about options
      </button>
      <input
        @change="this.updateFlags()"
        v-model="this.whisperFlags"
        type="text"
      />
    </div>
  </div>
  <br />
  <br />
  <router-link class="button" to="/generate">Next</router-link>
</template>

<script>
// @ is an alias to /src
const axios = require("axios");
export default {
  name: "SettingsView",
  components: {},
  created() {
    if (localStorage.getItem("workingDir")) {
      this.workingDir = localStorage.getItem("workingDir");
    }
    if (localStorage.getItem("whisperFlags")) {
      this.whisperFlags = localStorage.getItem("whisperFlags");
    } else {
      localStorage.setItem("whisperFlags", this.whisperFlags);
    }
  },
  data() {
    return {
      workingDir: "",
      whisperFlags: "--language en --model medium --device cuda",
    };
  },
  methods: {
    async selectDir() {
      await axios({
        method: "get",
        url: "http://localhost:9861/api/getDir",
      }).then((response) => {
        if (response.data !== false) {
          this.workingDir = response.data;
          localStorage.setItem("workingDir", response.data);
        }
      });
    },
    openUrl(url) {
      axios({
        method: "post",
        url: "http://localhost:9861/api/openUrl",
        data: {
          url: url,
        },
      });
    },
    updateFlags() {
      localStorage.setItem("whisperFlags", this.whisperFlags);
    },
  },
};
</script>

<style scoped>
button,
.button {
  background-color: #42b983;
  padding: 10px 18px;
  border-radius: 3px;
  border: none;
  cursor: pointer;

  font-size: 17px;
}

button:hover,
.button:hover {
  background-color: #70cca2;
}

button:active,
.button:active {
  background-color: #42b983;
}

input {
  background-color: #1d2935;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 10px 18px;
  font-size: 17px;

  margin-top: 20px;
  border: 1px solid #3e5770;

  width: 270px;

  /* Remove selected border */
  outline: none;
}

.settings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 10px;
  background-color: #1d2935;
  border-radius: 10px;

  margin-top: 20px;

  width: 300px;
}
</style>
