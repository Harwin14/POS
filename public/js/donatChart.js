$(document).ready((event) => {
    readData()
});

const readData = () => {
    let countDirect = null
    let countMember = null

    $.ajax({
        data: {
            startdate: $('#startdate').val(),
            enddate: $('#enddate').val()
        },
        url: 'dashboards/donatChart'
    }).done((res) => {
        const { member, direct } = res
        console.log('ini respon', member, direct)
        countDirect = direct[0].count
        countMember = member[0].count
        console.log(countDirect, countMember)
        const doughnut = $('#donatChart');
        new Chart(doughnut, {
            type: 'doughnut',
            data: {
                labels: ["Direct", "Member"],
                datasets: [{
                    cutout: '85%',
                    data: [countDirect, countMember],
                    backgroundColor: ['#4e73df', '#1cc88a'],
                    hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }],
            },
            options: {
                aspectRatio: 2,
                responsive: true,
                maintainAspectRatio: true,
                tooltips: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyFontColor: "#858796",
                    borderColor: '#dddfeb',
                    borderWidth: 2,
                    xPadding: 15,
                    yPadding: 15,
                    displayColors: false
                },
                legend: {
                    display: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true
                        }
                    }
                },
                cutoutPercentage: 80
            }
        })
    })
};