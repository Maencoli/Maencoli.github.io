var canvas = document.querySelector('canvas')
;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

const a = 277;
const b = 320;

c.beginPath();
c.moveTo(a, b);
c.lineTo(a + 145, b);
c.lineTo(a + 120, b+225);
c.lineTo(a + 25, b + 225);
c.lineTo(a, b);
c.lineWidth = 5;
c.stroke();
c.closePath();

c.beginPath();
c.moveTo(a+9, b+81);
c.lineTo(a+136, b+81);
c.stroke();

c.beginPath();
c.arc(a+50, b+73, 18, 0, Math.PI * 2, false);
c.stroke();



console.log(canvas);
/*/
for (var i = 0; i < 15; i++){
	var x = Math.random()*127+ a+9 ;
	if (x < a+25) {
		var y = Math.random()*(9*(x-a)-81)+b+81
	} else if (x > a+120) {
		var y = Math.random()*9*(136-x+a)+ b+81
	}else{
		var y = Math.random()*144+(b+81)
	};
	var size_ = Math.random()*3;
	c.beginPath();
	c.arc(x, y, size_, 0, Math.PI * 2, false);
	c.lineWidth = .5;
	c.stroke();
}
/*/

let bubbles = [];

for (var i = 0; i < 15; i++){
	var x = Math.random()*127+ a+9 ;
	if (x < a+25) {
		var y = Math.random()*(9*(x-a)-81)+b+81
	} else if (x > a+120) {
		var y = Math.random()*9*(136-x+a)+ b+81
	}else{
		var y = Math.random()*144+(b+81)
	};
	var sz = Math.random()*3;
	bubbles.push({
		x_: x,
		y_: y,
		size_: sz,
	})
}
	console.log(bubbles);

y = 0
var dx = 1;
function animate(){
	requestAnimationFrame(animate);
	c.clearRect(0,0,innerWidth, innerHeight);

	c.beginPath();
	c.moveTo(a, b);
	c.lineTo(a + 145, b);
	c.lineTo(a + 120, b+225);
	c.lineTo(a + 25, b + 225);
	c.lineTo(a, b);
	c.lineWidth = 5;
	c.stroke();
	c.closePath();

	c.beginPath();
	c.moveTo(a+9, b+81);
	c.lineTo(a+136, b+81);
	c.stroke();

	c.beginPath();
	c.arc(a+50, b+73, 18, 0, Math.PI * 2, false);
	c.stroke();

	for (var i =0; i< bubbles.length; i++){
	c.beginPath();
	c.arc(bubbles[i]['x_'], bubbles[i]['y_']+y, bubbles[i]['size_'], 0, Math.PI * 2, false);
	c.lineWidth = .5;
	c.stroke();
	}

	y -= dx



}


animate();