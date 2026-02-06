mod user;

use user::User;

fn main() {
    let user = User::new("Taylor", 29);
    println!("{}", user.summary());
}
