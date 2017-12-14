class Filters{
  constructor(height, width) {
    this.display = {
      map:true,
      mechanical_fail:true,
      navigation_error:true,
      weather:true,
      shot_down:true,
      crash_takingoff:true,
      crash_landing:true,
      air_collision:true,
      human_error:true,
      no_tag:true
    }
    this.filter_names = {
      map:"map",
      mechanical_fail:"mechanical fail",
      navigation_error:"navigation error",
      weather:"weather",
      shot_down:"shot down",
      crash_takingoff:"crash takingoff",
      crash_landing:"crash landing",
      air_collision:"air colsision",
      human_error:"human error",
      no_tag:"no tag"
    }

    this.setUp()
  }


  // Constructor
  setUp() {
      // Create the list element:
      let list = document.getElementById("list");
      (() => {
        'use strict'

        const employee_list = document.querySelector('#list')
        const test = "test bite couille"
        let filters_list;
        for(let f in this.filter_names) {
        const filter = `
          <p>${this.filter_names[f]}</p>
          <label class="switch">
            <input type="checkbox" name="${f}" onchange="onFilterChange(this.name)">
            <span class="slider round"></span>
          </label>
        `
        filters_list += filter;
      }
      employee_list.innerHTML += filters_list;
      })()
  }
  onFilterChange(checkboxElem) {
    display[checkboxElem] = !display[checkboxElem];
  }



}
