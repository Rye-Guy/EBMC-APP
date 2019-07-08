require('dotenv').config()
const Mailchimp = require('mailchimp-api-v3')
const axios = require('axios')
const mailchimp = new Mailchimp(process.env.MC_API_KEY)
const md5 = require('js-md5');

const chainAsync = fns => {
    let curr = 0;
    const last = fns[fns.length - 1];
    const next = () => {
        const fn = fns[curr++];
        fn === last ? fn() : fn(next);
    };
    next();
};

let timeToRef = ''

function theStuff() {
    let attendee_batch = []
    let attendees_checked_in = []

    axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}`).then((res) => {
        
        chainAsync([
                    next => {
                        for (i = 1; i <= res.data.pagination.page_count; i++) {
                            axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}&page=${i}`).then((res) => {
                                event_attendees = res.data.attendees
                                event_attendees.forEach(attendee => {
                                    dateChanged = attendee.changed
                                    dateChanged = new Date(dateChanged)
                                    console.log(timeToRef < dateChanged)
                                    console.log(timeToRef, dateChanged)
                                    if (timeToRef === '' || timeToRef < dateChanged) {
                                        attendee_obj = {
                                            "method": "post",
                                            "path": `/lists/${process.env.MC_AUDIENCE_ID}/members/`,
                                            "body": {
                                                "email_address": attendee.profile.email,
                                                "status": "subscribed",
                                                "merge_fields": {
                                                    "FNAME": attendee.profile.first_name,
                                                    "LNAME": attendee.profile.last_name
                                                }
                                            }
                                        }
                                        attendee_batch.push(attendee_obj)
                                    
                                        if(attendee.checked_in){
                                            attendee_checked_in_tag = {
                                                "method": "post",
                                                "path": `/lists/${process.env.MC_AUDIENCE_ID}/members/${md5(attendee.profile.email)}/tags`,
                                                "body": {
                                                    "tags": [{
                                                        "name": process.env.MC_TAG_NAME,
                                                        "status": "active"
                                                    }]
                                                }
                                            }
                                            attendees_checked_in.push(attendee_checked_in_tag)
                                        }
                                    }
                                })
                     
                            }).catch((err) => {
                                console.log(err)
                            })
                        }
                        
                        setTimeout(next, 5000);
                    }, next => {
                        timeToRef = new Date();
                        
                        console.log('5 second');
                        mailchimp.batch(attendee_batch, {
                            wait: true,
                            interval: 1000,
                            unpack: true,
                        }).then((res)=>{
                            console.log(res)
                        }).catch((err)=>{
                            console.log(err)
                        })
           
                        setTimeout(next, 10000);
                    },() =>{
                        console.log('15 seconds')
                        mailchimp.batch(attendees_checked_in, {
                            wait: true,
                            interval: 1000,
                            unpack: true,
                        }).then((res)=>{
                            console.log(res)
                        }).catch((err)=>{
                            console.log(err)
                        })
                    }
            ])
        }
    )
    setTimeout(theStuff, 60000)
}
    theStuff();