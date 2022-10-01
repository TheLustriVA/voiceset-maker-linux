<template>
  <div class="settings">
    <div class="setting">
      <h3>Select Audio File</h3>
      <button @click="this.selectFile()">Select File</button>
      <input v-model="this.audioFile" type="text" />
    </div>
    <div class="setting">
      <h3>Model Name</h3>
      <input
        style="text-align: center"
        v-model="this.modelName"
        @change="this.updateName()"
        type="text"
      />
    </div>
    <br />
    <br />
    <br />
    <button
      v-if="this.audioFile !== '' && this.loading !== true"
      @click="this.processAudio()"
    >
      🚀 Generate 🚀
    </button>
    <div v-if="this.loading == true">
      <LoadingSpinner class="spinner"></LoadingSpinner>
    </div>
    <div v-if="this.finished == true">
      <h3>Finished!</h3>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from "../components/LoadingSpinner.vue";
// @ is an alias to /src
const axios = require("axios");
export default {
  name: "SettingsView",
  components: { LoadingSpinner },
  created() {
    if (localStorage.getItem("audioFile")) {
      this.audioFile = localStorage.getItem("audioFile");
    }
    if (localStorage.getItem("modelName")) {
      this.modelName = localStorage.getItem("modelName");
    }
  },
  data() {
    return {
      audioFile: "",
      modelName: "",
      loading: false,
      finished: false,
    };
  },
  methods: {
    async selectFile() {
      this.loading = undefined;
      this.finished = undefined;
      await axios({
        method: "post",
        url: "http://localhost:9861/api/getFile",
        data: {
          workingDir: localStorage.getItem("workingDir"),
        },
      }).then((response) => {
        if (response.data !== false) {
          this.audioFile = response.data;
        } else {
          this.audioFile = "";
        }
        sessionStorage.setItem("audioFile", this.audioFile);
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
    async processAudio() {
      if (this.modelName == "") {
        axios({
          method: "post",
          url: "http://localhost:9861/api/errorMessage",
          data: {
            title: "No Model Name",
            message: "Please enter a model name.",
          },
        });
      } else {
        this.loading = true;
        this.finished = false;
        await axios({
          method: "post",
          url: "http://localhost:9861/api/start",
          data: {
            filePath: this.audioFile,
            workingDir: localStorage.getItem("workingDir"),
            whisperFlags: localStorage.getItem("whisperFlags"),
            modelName: this.modelName,
          },
        })
          .then((response) => {
            if (response.data == "finished") {
              this.loading = false;
              this.finished = true;
            }
          })
          .catch((error) => {
            console.log(error);
            axios({
              method: "post",
              url: "http://localhost:9861/api/errorMessage",
              data: {
                title: "Error",
                message: error.response.data.error,
              },
            });
          });
      }
    },
    updateName() {
      localStorage.setItem("modelName", this.modelName);
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
