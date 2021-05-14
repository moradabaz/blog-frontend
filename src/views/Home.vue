<template>
  <b-container class="bv-example-row">
    <b-row align-h="center" align-v="center" class="justify-content-md-center">
      <b-col col lg="2"> <img alt="Vue logo" src="../assets/avatar.png"> </b-col>
      <h1 class="headline center">Trust Software, Not Humans</h1>
    </b-row>
    <br>
    <br>
    <h3>Hi Everyone</h3>
    <br>
    <p>
      Hi everyone, my name is <b>Morad</b> and I’m just another Software Engineer who likes to share content related to computer Science and coding stuff.
      I hope you enjoy my website :)
    </p>
    <h3>My Blog</h3>
    <br>

    <b-container>
      <b-col>
        <b-carousel
            id="carousel-1"
            v-model="slide"
            :interval="4000"
            controls
            indicators
            background="#ababab"
            img-width="1024"
            img-height="480"
            style="text-shadow: 1px 1px 2px #333; cursor: pointer;"
            @sliding-start="onSlideStart"
            @sliding-end="onSlideEnd"

        >
          <div v-for="(section, index) in Object.keys(entries)" :key="index" class="group">
            <div class="section" v-for="entry in entries[section]" :key="entry.id">
              <div class="entry" v-on:click="$router.push({name: entry.id})">
                <b-carousel-slide
                    :text="entry.description"
                    :img-src="entry.imgpath"
                ></b-carousel-slide>
              </div>
            </div>
          </div>
        </b-carousel>
        <br>
        <div class="mb-3">
          <b-button block variant="info" href="/blog/">More Posts here</b-button>
        </div>
        <br>
        <br>



        <b-carousel>

        </b-carousel>

      </b-col>
    </b-container>

  </b-container>


</template>

<script>

export default {
  name: "Home",
  computed: {
    entries() {

      return {
        stories: [
          {
            id: "2021-04-06-adult-income",
            title: "Data Science Exercise: Predition Models with Python",
            description: "We want to predict if a person earns more than 50.000$ by doing a supervised Learning exercise and data exploration. In this post, we have used Python for Data Science and deployed our model.",
            imgpath : require('../assets/img/blogs/adult-income.jpeg')
          },
          {
            id: "2021-04-04-statistical-learning-rstudio",
            title: "Data Science with Rstudio: Let's do an exercise",
            description: "A Simple Supervised Learning exercise using Rstudio to predict the british vote of the 2002 elections",
            imgpath : require('../assets/img/blogs/rstudio.png')
          },
          {
            id: "2021-04-01-introduction-to-c",
            title: "Introduction to C Language",
            description: "A brief introduction to C Language for beginners who still don't know nothing about the most hated and loved language",
            imgpath : require('../assets/img/blogs/c-programming.png')
          }
        ]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
img {
  display: block;
  margin: 0 auto;
  width: 150px;
}

h1 {
  color: rgba(41, 196, 80, 0.57);
  font-family:  HelvetHelvetica Neueica, sans-serif;
  font-weight: 100;
  font-size: 50px;
}

h5 {
  font-family:  Helvetica Neue, sans-serif;
  margin-top: .12rem;
  margin-bottom: 4rem;
}

h3 {
  color: rgba(2, 2, 61, 0.95);
  font-family:  Helvetica, sans-serif;
  font-style: normal;
  font-weight: 100;
  font-size: 30px;
}

p {
  font-size: 18px;
  font-family:  Helvetica Neue, sans-serif;
  margin-top: .4rem;
  margin-bottom: 4rem;

}

.card-group .card {
  max-width: 25%;
}
.card-img-top {
  width: 100%;
  height: 40vh;
  object-fit: cover;
}


</style>