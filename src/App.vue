<template>
  <nav class="tree-path">
    <router-link to="/setup" class="tree-branch"> Setup </router-link>
    <router-link
      to="/settings"
      :class="`tree-branch ${this.dependencies ? '' : 'disabled'}`"
    >
      Settings
    </router-link>
    <router-link
      to="/generate"
      :class="`tree-branch ${this.dependencies ? '' : 'disabled'}`"
    >
      Generate
    </router-link>
  </nav>
  <router-view />
</template>

<script>
const axios = require("axios");
export default {
  name: "App",
  components: {},
  data() {
    return {
      dependencies: false,
    };
  },
  async created() {
    // Check if both dependencies are installed on client computer
    axios({
      method: "get",
      url: "http://localhost:9861/api/dependencies",
    }).then((response) => {
      if (!response.data.ffmpeg || !response.data.whisper) {
        sessionStorage.setItem("ffmpeg", response.data.ffmpeg);
        sessionStorage.setItem("whisper", response.data.whisper);
        this.$router.push("/setup");
      } else {
        this.dependencies = true;
        sessionStorage.setItem("ffmpeg", response.data.ffmpeg);
        sessionStorage.setItem("whisper", response.data.whisper);
        this.$router.push("/settings");
      }
    });
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap");
#app {
  text-align: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

* {
  font-family: "Source Code Pro", monospace;
  color: #ffff;
}

body {
  background-color: #304457;
  margin: 0;
}

/* Navigation bar */

nav {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: #42b983;
}

nav a {
  text-decoration: none;

  font-size: 20px;
  font-weight: bold;
  color: #fff;

  padding: 10px 0;
  margin: 0 10px;
  border-bottom: 2px solid #42b983;
}

nav a.router-link-exact-active {
  border-bottom: 2px solid white;
}

.disabled {
  pointer-events: none;
  opacity: 80%;
}
</style>
