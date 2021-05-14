<template>
<div id="adultincome">
  <h2> Adult Census Income</h2>
  <br>

  <br>
  <!-- FIELD PARAMETERS -->
  <b-col>
    <!-- FIELD TITLES -->
    <div class="container">
      <div class="row">
        <div class="col-sm">
          Personal information
        </div>
        <div class="col-sm">
          Professional information
        </div>
      </div>
    </div>
    <!-- END FIELD TITLES -->
    <br>
    <br>
    <!-- FIELDS -->
    <div class="container">
      <div class="row">

       <!--  PERSONAL INFORMATION FIELDS -->
        <div class="col-sm">
          <b-col>

            <b-col>
              <p> Sex </p>
              <div>
                <b-form-select v-model="form.sex" class="mb-3">
                  <b-form-select-option :value="1">Male</b-form-select-option>
                  <b-form-select-option :value="1">Female</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p> Race </p>
              <div>
                <b-form-select v-model="form.race" class="mb-3">
                  <b-form-select-option  v-for="(item) in this.race" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>



            <b-col>
              <p> Native Country </p>
              <div>
                <b-form-select v-model="form.country" class="mb-3">
                  <b-form-select-option  v-for="(item) in this.countries" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p>Marital Status</p>
              <div>
                <b-form-select  class="mb-3" v-model="form.maritalStatus" >
                  <b-form-select-option v-for="(item) in this.maritalStatus" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p> Age </p>
              <input v-model="form.age"
                  type="number"
                  class="validate"
              />
            </b-col>

          </b-col>
        </div>
        <!--  PERSONAL INFORMATION FIELDS -->

        <!--  PROFESSIONAL INFORMATION FIELDS -->
        <div class="col-sm">

          <b-col>
            <b-col>
              <p>Workclass</p>
              <div>
                <b-form-select  class="mb-3" v-model="form.workclass">
                  <b-form-select-option  v-for="(item) in this.workclass" v-bind:value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p>Education</p>
              <div>
                <b-form-select  class="mb-3" v-model="form.education">
                  <b-form-select-option  v-for="(item) in this.education" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p>Job Occupation</p>
              <div>
                <b-form-select  class="mb-3" v-model="form.occupation">
                  <b-form-select-option  v-for="(item) in this.occupation" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p>Relationship</p>
              <div>
                <b-form-select class="mb-3" v-model="form.relationship">
                  <b-form-select-option  v-for="(item) in this.relationship" :value="item.value">{{item.text}}</b-form-select-option>
                </b-form-select>
              </div>
            </b-col>

            <b-col>
              <p>Hours worked per week</p>
              <input v-model="form.hours"
                  type="number"
                  class="validate"
                  step="any"
              />
            </b-col>

          </b-col>
        </div>

        <!--  END PROFESSIONAL INFORMATION FIELDS -->

      </div>
    </div>

  </b-col>
  <!-- END FIELDS PARAMETERS -->
  <br>
  <br>
  <b-button variant="primary" v-on:click="predict()">Predict Class</b-button>

  <br>
  <br>

  <p>{{ this.prediction }}</p>
  <br>
  <br>
  <h6>Hey family, If you want to read my blog post about how we created this prediction model, please click on this <a href="/stories/2021-04-06-adult-income">link</a></h6>
  <br>
  <br>
  <b> The prediction task is to determine whether a person makes over $50K a year.</b>
  <br>
  <p>This data was extracted from the <a href="https://www.census.gov/en.html"> 1994 Census bureau database </a>by Ronny Kohavi and Barry Becker (Data Mining and Visualization, Silicon Graphics). A set of reasonably clean records was extracted using the following conditions:
    <code> ((AAGE>16) && (AGI>100) && (AFNLWGT>1) && (HRSWK>0))</code>.</p>
  <br>
  <br>
</div>
</template>

<script>
import axios from "axios";
import Vue from "vue";
export default {


  name: "AdultIncome",
  data() {

    return {
      workclassValue: null,
      prediction: '',
      form: {
        sex: 0,
        race: 0,
        country: 0,
        maritalStatus: 0,
        age: 0,
        workclass: 0,
        education: 0,
        occupation: 0,
        relationship: 0,
        hours: 0
      },
      race :[
        {value: 4 , text: ' White '},
        {value: 2 , text: ' Black '},
        {value: 1 , text: ' Asian/Pacific/Oceania '},
        {value: 3 , text: ' Other '},
        {value: 0 , text: ' Native American/Hispanic/Eskimo '},
      ],
      countries :[
        {value: 39 , text: ' United-States '},
        {value: 0 , text: ' Other Country '},
        {value: 26 , text: ' Mexico '},
        {value: 12 , text: ' Greece '},
        {value: 40 , text: ' Vietnam '},
        {value: 3 , text: ' China '},
        {value: 36 , text: ' Taiwan '},
        {value: 19 , text: ' India '},
        {value: 30 , text: ' Philippines '},
        {value: 38 , text: ' Trinadad&Tobago '},
        {value: 2 , text: ' Canada '},
        {value: 35 , text: ' South '},
        {value: 15 , text: ' Holand-Netherlands '},
        {value: 33 , text: ' Puerto-Rico '},
        {value: 31 , text: ' Poland '},
        {value: 20 , text: ' Iran '},
        {value: 9 , text: ' England '},
        {value: 11 , text: ' Germany '},
        {value: 22 , text: ' Italy '},
        {value: 24 , text: ' Japan '},
        {value: 17 , text: ' Hong '},
        {value: 16 , text: ' Honduras '},
        {value: 5 , text: ' Cuba '},
        {value: 21 , text: ' Ireland '},
        {value: 1 , text: ' Cambodia '},
        {value: 29 , text: ' Peru '},
        {value: 27 , text: ' Nicaragua '},
        {value: 6 , text: ' Dominican-Republic '},
        {value: 14 , text: ' Haiti '},
        {value: 8 , text: ' El-Salvador '},
        {value: 18 , text: ' Hungary '},
        {value: 4 , text: ' Columbia '},
        {value: 13 , text: ' Guatemala '},
        {value: 23 , text: ' Jamaica '},
        {value: 7 , text: ' Ecuador '},
        {value: 10 , text: ' France '},
        {value: 41 , text: ' Yugoslavia '},
        {value: 34 , text: ' Scotland '},
        {value: 32 , text: ' Portugal '},
        {value: 25 , text: ' Laos '},
        {value: 37 , text: ' Thailand '},
        {value: 28 , text: ' US oversea terrotories'},
      ],
      workclass :[
        {value: 4 , text: ' Private Sector '},
        {value: 7 , text: ' State Goverment '},
        {value: 1 , text: ' Federal Goverment '},
        {value: 6 , text: ' Unincoporated Self employed '},
        {value: 5 , text: ' Incorporated Self Employed '},
        {value: 2 , text: ' Local Goverment '},
        {value: 8 , text: ' Volunteering '},
        {value: 3 , text: ' Never worked '},
        {value: 0 , text: ' Unknown status '},
      ],
      education: [
        {value: 16, text: 'Doctorate'},
        {value: 15, text: 'School Professor'},
        {value: 14, text: 'Masters'},
        {value: 13, text: 'Has a Bachelors Degree'},
        {value: 12, text: 'Academic Associate'},
        {value: 11, text: 'Vocal Associate'},
        {value: 10, text: 'Didn\'t finish Graduate'},
        {value: 9, text: 'High School Graduate'},
        {value: 8, text: '12th'},
        {value: 7, text: '11th'},
        {value: 6, text: '10th'},
        {value: 5, text: '9th'},
        {value: 4, text: '7th-8th'},
        {value: 3, text: '5th-6th'},
        {value: 2, text: '1st-4th'},
        {value: 1, text: 'Preschool'}
      ],
      occupation: [
        {value: 4, text: 'Executive Manager'},
        {value: 7, text: 'Machine Operation Inspector'},
        {value: 10, text: 'Specialized Professional'},
        {value: 8, text: 'Other Service'},
        {value: 1, text: 'Clerical Administration'},
        {value: 3, text: 'Craft Repair'},
        {value: 14, text: 'Transportation'},
        {value: 6, text: 'Handlers/Cleanres'},
        {value: 12, text: 'Sales'},
        {value: 5, text: 'Farming/Fishing'},
        {value: 13, text: 'Tech. Support'},
        {value: 11, text: 'Protection Service'},
        {value: 2, text: 'Armed Forces'},
        {value: 9, text: 'Private House service'},
        {value: 0, text: 'Unclassified Occupation'},
      ],

      maritalStatus : [
        {value: 2 , text: ' Civil Mariage '},
        {value: 3 , text: ' Married but absent '},
        {value: 1 , text: ' spouse in the Armed Forces '},
        {value: 6 , text: ' Widowed '},
        {value: 0 , text: ' Divorced '},
        {value: 5 , text: ' Separated '},
        {value: 4 , text: ' Never married '}
      ],

      relationship: [
        {value: 0, text: 'Husband'},
        {value: 5, text: 'Wife'},
        {value: 3, text: 'Has a child'},
        {value: 4, text: 'Not married'},
        {value: 2, text: 'Other relative'},
        {value: 1, text: 'Doesn\'t live with family'},
      ]
    }
  },
  methods: {
    predict() {
      this.prediction = ''
      const path = Vue.prototype.$backendURL + 'predict-adult-income/'
      if (parseInt(this.form.age) <= 15) {
        this.prediction = 'Please check the Age field. This person is too young'
        return
      }

      if (parseFloat(this.form.hours) <= 0) {
        this.prediction = 'Please check the hours per week. It can\'t be lower or equals zero'
        return;
      }


      axios.post(path, this.form).then((response) => {
        if (parseInt(response.data['prediction']) === 0) {
          this.prediction = 'This person is problably NOT earning more than 50.000$ a year'
        } else {
          this.prediction = 'This person is likely to earn more than 50.000$ a year'
        }
        this.prediction_serie = "Your serie belongs to the class number " + response.data['predicted_class']
      })
    }
  }
}
</script>

<style scoped>
#adultincome {
  text-align: center;
}
</style>